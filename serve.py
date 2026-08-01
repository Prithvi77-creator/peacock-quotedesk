#!/usr/bin/env python3
"""Tiny static server for local testing of Peacock QuoteDesk.

Sends no-cache headers so edits to js/css always show up on reload
(python's default http.server lets browsers cache subresources, which
hides changes during testing). Not needed in production — there the
files are served by the real web host / PHP.

    python3 serve.py [port]        # default port 8123
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
import os

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # quiet

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    here = os.path.dirname(os.path.abspath(__file__))
    handler = partial(NoCacheHandler, directory=here)
    httpd = ThreadingHTTPServer(('127.0.0.1', port), handler)
    print(f'Peacock QuoteDesk running at http://localhost:{port}  (Ctrl+C to stop)')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nstopped')
