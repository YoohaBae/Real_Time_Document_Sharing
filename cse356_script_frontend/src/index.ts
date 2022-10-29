import * as Y from 'yjs'
import * as base64 from "byte-base64";

// import axios from 'axios';


class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
}

function jsonStringToUint8Array(jsonString: string) {
    let json = JSON.parse(jsonString);
    let ret = new Uint8Array(Object.keys(json).length);
    for (let key in json) {
        // @ts-ignore
        ret[key] = json[key];
    }
    return ret;
};


exports.CRDT = class {
    doc = new Y.Doc();
    text = this.doc.getText('test');
    cb: (update: string, isLocal: Boolean) => void;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.cb = cb;
        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
    }

    update(update: string) {
        // axios.post('http://194.113.72.22/log' , {update, function: "update"})
        //             .then(response => console.log(response));
        let data = jsonStringToUint8Array(update);
        Y.applyUpdate(this.doc, data);
        this.cb(this.toHTML(), false);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        // axios.post('http://194.113.72.22/log' , {index, content, format, function: "insert"})
        //             .then(response => console.log(response));
        this.doc.on('update', (update) => {
            let message = ({
                clientID: this.doc.clientID,
                update: base64.bytesToBase64(update),
                parameter: {index, content, format}
            })
            this.cb(JSON.stringify(message), true);
        })
        this.text.insert(index, content, format);
    }

    delete(index: number, length: number) {
        // axios.post('http://194.113.72.22/log' , {index, length, function: "delete"})
        //             .then(response => console.log(response));
        this.doc.on('update', (update) => {
            let message = ({
                clientID: this.doc.clientID,
                update: base64.bytesToBase64(update),
                parameter: {index, length}
            })
            this.cb(JSON.stringify(message), true);
        })
        this.text.delete(index, length);
    }

    toHTML() {
        // axios.post('http://194.113.72.22/log' , {function: "toHTML"})
        //             .then(response => console.log(response));
        let html = "";
        let delta = this.doc.getText('test').toDelta();
        // @ts-ignore
        for (let index in delta) {
            // @ts-ignore
            let action = delta[index]
            if (action["insert"] !== undefined) {
                // @ts-ignore
                let curr = action["insert"]
                curr = curr.replaceAll("\\r\\n", "\\n");
                curr = curr.replaceAll("\r\n", "\n")
                curr = curr.replaceAll("\\n", "<br/>");
                curr = curr.replaceAll("\n", "<br/>");
                // @ts-ignore
                if (action["attributes"] !== undefined) {
                    // @ts-ignore
                    let attribute = action["attributes"]
                    if (attribute["underline"] == true) {
                        if (curr.includes("<br/>")) {
                            curr = curr.replace("<br/>", "");
                            curr = '<u>' + curr + '</u>';
                            curr = curr + "<br/>"
                        } else {
                            curr = '<u>' + curr + '</u>';
                        }
                    }
                    if (attribute["italic"] == true) {
                        if (curr.includes("<br/>")) {
                            curr = curr.replace("<br/>", "");
                            curr = '<em>' + curr + '</em>';
                            curr = curr + "<br/>"
                        } else {
                            curr = '<em>' + curr + '</em>';
                        }
                    }
                    if (attribute["bold"] == true) {
                        if (curr.includes("<br/>")) {
                            curr = curr.replace("<br/>", "");
                            curr = '<strong>' + curr + '</strong>';
                            curr = curr + "<br/>"
                        } else {
                            curr = '<strong>' + curr + '</strong>'
                        }
                    }
                    if (attribute["link"]) {
                        const link = attribute["link"];
                        curr = `<a href="${link}" target="_blank">` + curr + "</a>";
                    }
                }
                html = html + curr;
            }
        }
        html = '<p>' + html + '</p>'
        return html;
    }
};
