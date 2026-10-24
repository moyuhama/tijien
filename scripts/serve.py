#!/usr/bin/env python3
"""Optional local HTTP preview; binds only to this computer's loopback address."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parents[1] / 'dist'
parser = argparse.ArgumentParser(description='拾题英语自习室 · 本地服务')
parser.add_argument('--port', type=int, default=8765)
parser.add_argument('--no-open', action='store_true')
args = parser.parse_args()
URL = f'http://127.0.0.1:{args.port}'


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/study-room-health':
            data = json.dumps({'app': 'shiti-study-room', 'root':str(ROOT)}).encode()
            self.send_response(200)
            self.send_header('Content-Type','application/json')
            self.send_header('Content-Length',str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


try:
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(ROOT)))
except OSError:
    try:
        with urllib.request.urlopen(URL + '/study-room-health', timeout=2) as response:
            info = json.load(response)
        assert info.get('app') == 'shiti-study-room' and info.get('root') == str(ROOT)
    except Exception:
        raise SystemExit(f'端口 {args.port} 已被其他服务占用。可双击“打开英语自习室.html”直接打开，或使用 --port 指定其他端口。')
    print('自习室已在运行：' + URL)
    if not args.no_open:
        webbrowser.open(URL)
    raise SystemExit(0)

print('拾题 · 英语自习室', flush=True)
print('本地地址：' + URL, flush=True)
print('只在这台电脑运行。按 Control+C 关闭服务。', flush=True)
if not args.no_open:
    webbrowser.open(URL)
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\n已关闭本地服务。')
finally:
    server.server_close()
