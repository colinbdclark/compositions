(function() {

    /**********************
     * Code Mirror Editor *
     **********************/

    fluid.defaults("flock.ui.codeEditor.cm", {
        gradeNames: ["fluid.viewComponent", "autoInit"],

        members: {
            editor: {
                expander: {
                    func: "CodeMirror",
                    args: ["{that}.container.0", "{that}.options.cmOptions"]
                }
            }
        },

        invokers: {
            setContent: {
                funcName: "flock.ui.codeEditor.cm.setContent",
                args: ["{arguments}.0", "{that}.editor", "{that}.events.afterContentReplaced.fire"]
            },

            getContent: {
                funcName: "flock.ui.codeEditor.cm.getContent",
                args: ["{that}.editor"]
            },

            getSelection: {
                funcName: "flock.ui.codeEditor.cm.getSelection",
                args: ["{that}.editor", "{arguments}.0"]
            }
        },

        events: {
            afterContentReplaced: null
        },

        cmOptions: {
            mode: {
                name: "javascript",
                json: true
            },
            autoCloseBrackets: true,
            matchBrackets: true,
            smartIndent: true,
            theme: "flockingcm",
            indentUnit: 4,
            tabSize: 4,
            lineNumbers: true
        }
    });

    flock.ui.codeEditor.cm.getContent = function (editor) {
        return editor.getDoc().getValue();
    };

    flock.ui.codeEditor.cm.setContent = function (code, editor, afterContentReplaced) {
        var doc = editor.getDoc();
        doc.setValue(code);
        afterContentReplaced(code, doc);
    };

    flock.ui.codeEditor.cm.getSelection = function (editor, asJSON) {
        var selection = editor.getDoc().getSelection();

        try {
            return asJSON ? JSON.parse(selection) : selection;
        } catch (e) {
            flock.fail(e.message);
        }
    };

}());
