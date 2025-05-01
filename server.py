import logging
from pygls import hookimpl, uris, workspace, lsp
from pygls.workspace import Document
from pygls.lsp import CompletionItem, CompletionItemKind
import pygls


logging.basicConfig(level=logging.DEBUG)

class EchoLanguageServer:
    def __init__(self):
        self.workspace = workspace.Workspace(None, None)

    def start(self):
        @hookimpl
        def pylsp_initialize(config, root_uri, initialization_options):
            """Initialization handler."""
            self.workspace.initialize(root_uri, None)

        @hookimpl
        def pylsp_text_document_did_change(params):
            """Text document did change notification."""
            uri = params['textDocument']['uri']
            document = self.workspace.get_document(uri)
            for change in params['contentChanges']:
                document.apply_change(change)

        @hookimpl
        def pylsp_text_document_completion(params):
            """Returns completion items."""
            uri = params['textDocument']['uri']
            document = self.workspace.get_document(uri)
            # Basic code completion
            return [
                CompletionItem(label="if", kind=CompletionItemKind.Keyword),
                CompletionItem(label="for", kind=CompletionItemKind.Keyword),
                CompletionItem(label="while", kind=CompletionItemKind.Keyword),
                CompletionItem(label="def", kind=CompletionItemKind.Keyword),
                CompletionItem(label="class", kind=CompletionItemKind.Keyword),
            ]

if __name__ == '__main__':
    EchoLanguageServer().start()
print(dir(pygls))
