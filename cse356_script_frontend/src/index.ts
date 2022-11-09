import * as Y from 'yjs'
// @ts-ignore
import {QuillDeltaToHtmlConverter} from 'quill-delta-to-html';


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
                update: update,
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
                update: update,
                parameter: {index, length}
            })
            this.cb(JSON.stringify(message), true);
        })
        this.text.delete(index, length);
    }

    toHTML() {
        let delta = this.doc.getText('test').toDelta();
        // @ts-ignore
        let cfg = {
            "paragraphTag": 'p'
        }
        let converter = new QuillDeltaToHtmlConverter(delta, cfg);
        return converter.convert();
    }
};
