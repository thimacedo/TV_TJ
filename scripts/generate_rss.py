#!/usr/bin/env python3
"""
Gerador de RSS para as noticias do TJRN
https://tjrn.jus.br/noticias/assuntos/noticias/
"""

import argparse
import json
import re
import sys
import xml.sax.saxutils
from datetime import datetime, timezone

import requests

BASE_URL = "https://tjrn.jus.br/noticias/assuntos/noticias/"
RSS_SOURCE_URL = "https://tjrn.jus.br"
OUTPUT_FILE = "public/tjrn_noticias_imagens.xml"


def fecha_noticias(pagina=0):
    """Fetch da pagina de noticias, extrai dados do __NEXT_DATA__."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
    }
    url = f"{BASE_URL}?page={pagina}"
    r = requests.get(url, headers=headers, timeout=15)
    r.encoding = "utf-8"

    if r.status_code != 200:
        raise Exception(f"Erro ao acessar {url}: status {r.status_code}")

    match = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
        r.text,
        re.DOTALL,
    )
    if not match:
        raise Exception("Nao foi possivel encontrar __NEXT_DATA__ na pagina")

    data = json.loads(match.group(1))
    resultados = data.get("props", {}).get("pageProps", {}).get("resultados", {})
    content = resultados.get("content", [])
    total_pages = resultados.get("totalPages", 1)

    if not content:
        raise Exception("Nenhuma noticia encontrada na pagina")

    return content, total_pages


def extrair_texto_html(corpo_json):
    """Extrai texto legivel dos blocos do corpo da noticia."""
    partes = []
    for bloco in corpo_json.get("blocks", []):
        btype = bloco.get("type", "")
        bdata = bloco.get("data", {})
        if btype == "paragraph":
            texto = bdata.get("text", "")
            texto = re.sub(r"<br\s*/?>", "\n", texto)
            texto = re.sub(r"<[^>]+>", "", texto)
            if texto:
                partes.append(texto)
        elif btype == "delimiter":
            partes.append("---")
        elif btype == "list":
            lista = bdata.get("items", [])
            for item in lista:
                texto = re.sub(r"<[^>]+>", "", item)
                if texto:
                    partes.append(f"  - {texto}")
        elif btype == "quote":
            texto = bdata.get("text", bdata.get("title", ""))
            texto = re.sub(r"<[^>]+>", "", texto)
            if texto:
                partes.append(f'"{texto}"')
    return "\n\n".join(partes) if partes else "Sem conteudo disponivel."


def parse_data(data_str):
    if not data_str:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(data_str)
    except ValueError:
        return datetime.now(timezone.utc)


def formatar_rss_pubdate(dt):
    """Formata datetime como RSS pubDate em UTC.

    Usa +0000 para compatibilidade com o NewsService.ts que verifica
    rawDate.includes('+0000') para formatar a data no browser.
    """
    # Converte para UTC e formata como +0000
    utc_dt = dt.astimezone(timezone.utc)
    return utc_dt.strftime("%a, %d %b %Y %H:%M:%S") + " +0000"


def gerar_rss(artigos, titulo=None, descricao=None, max_items=None):
    now = formatar_rss_pubdate(datetime.now(timezone.utc))

    if artigos:
        primeiro_data = parse_data(artigos[0].get("data_publicacao", ""))
        last_build = formatar_rss_pubdate(primeiro_data)
    else:
        last_build = now

    feed_titulo = titulo or "Noticias - TJRN"
    feed_descricao = descricao or "Ultimas noticias do Tribunal de Justica do Rio Grande do Norte"

    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
        "  <channel>",
        f"    <title>{xml.sax.saxutils.escape(feed_titulo)}</title>",
        f"    <link>{xml.sax.saxutils.escape(BASE_URL)}</link>",
        f"    <description>{xml.sax.saxutils.escape(feed_descricao)}</description>",
        f"    <language>pt-br</language>",
        f"    <lastBuildDate>{last_build}</lastBuildDate>",
        f"    <pubDate>{now}</pubDate>",
        f'    <atom:link href="{xml.sax.saxutils.escape(BASE_URL)}" rel="self" type="application/rss+xml"/>',
        "    <image>",
        f"      <url>{xml.sax.saxutils.escape('https://tjrn.jus.br/icons/favicon.ico')}</url>",
        f"      <title>{xml.sax.saxutils.escape(feed_titulo)}</title>",
        f"      <link>{xml.sax.saxutils.escape(BASE_URL)}</link>",
        "    </image>",
    ]

    items = artigos[:max_items] if max_items else artigos

    for art in items:
        titulo_art = xml.sax.saxutils.escape(art.get("titulo", "Sem titulo"))
        apelido = art.get("apelido", str(art.get("id", "")))
        link = f"{RSS_SOURCE_URL}/noticias/{apelido}"
        data_pub = art.get("data_publicacao", "")
        dt = parse_data(data_pub)
        pub_date = formatar_rss_pubdate(dt)
        autor = xml.sax.saxutils.escape(art.get("autor", ""))
        img_url = art.get("url_img", "")

        corpo = art.get("corpo", {})
        texto = extrair_texto_html(corpo) if corpo else "Conteudo disponivel no site."
        descricao_art = xml.sax.saxutils.escape(texto[:5000])

        xml_parts.append("    <item>")
        xml_parts.append(f"      <title>{titulo_art}</title>")
        xml_parts.append(f"      <link>{xml.sax.saxutils.escape(link)}</link>")
        xml_parts.append(f"      <description>{descricao_art}</description>")

        if autor:
            xml_parts.append(f"      <author>{autor}</author>")

        xml_parts.append(f"      <pubDate>{pub_date}</pubDate>")
        xml_parts.append(f"      <guid isPermaLink=\"true\">{xml.sax.saxutils.escape(link)}</guid>")

        if img_url:
            xml_parts.append(
                f'      <enclosure url="{xml.sax.saxutils.escape(img_url)}" type="image/jpeg"/>'
            )
            xml_parts.append("      <media:content>")
            xml_parts.append(f"        <media:thumbnail url=\"{xml.sax.saxutils.escape(img_url)}\"/>")
            xml_parts.append("      </media:content>")

        xml_parts.append("    </item>")

    xml_parts.append("  </channel>")
    xml_parts.append("</rss>")

    return "\n".join(xml_parts)


def main():
    parser = argparse.ArgumentParser(
        description="Gera feed RSS das noticias do TJRN"
    )
    parser.add_argument(
        "-o", "--output",
        default=OUTPUT_FILE,
        help=f"Arquivo de saida (default: {OUTPUT_FILE})",
    )
    parser.add_argument(
        "-n", "--max-items",
        type=int,
        default=50,
        help="Numero maximo de itens no feed (default: 50)",
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=1,
        help="Numero de paginas para buscar (default: 1)",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Imprime o RSS no stdout ao inves de salvar em arquivo",
    )
    args = parser.parse_args()

    todos_artigos = []

    for pg in range(args.pages):
        print(f"Buscando pagina {pg + 1}...", file=sys.stderr)
        try:
            artigos, total_pages = fecha_noticias(pagina=pg)
            todos_artigos.extend(artigos)
            if pg + 1 >= total_pages:
                break
        except Exception as e:
            print(f"Aviso: Erro ao buscar pagina {pg + 1}: {e}", file=sys.stderr)

    if not todos_artigos:
        print("Erro: Nenhuma noticia encontrada.", file=sys.stderr)
        sys.exit(1)

    print(f"Total de noticias encontradas: {len(todos_artigos)}", file=sys.stderr)

    rss_xml = gerar_rss(todos_artigos, max_items=args.max_items)

    if args.stdout:
        print(rss_xml)
    else:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(rss_xml)
        print(f"RSS gerado com sucesso: {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
