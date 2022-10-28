import React, {useEffect, useState} from 'react';
import {useParams} from "react-router-dom";
import {QuillBinding} from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import 'react-quill/dist/quill.snow.css';
import urlJoin from "url-join";
import * as Y from 'yjs';
import axios from 'axios';
import * as base64 from "byte-base64";
import {Buffer} from 'buffer';

const {REACT_APP_BACKEND_URL} = process.env;

Quill.register('modules/cursors', QuillCursors);

const jsonStringToUint8Array = (jsonString) => {
    let ret = new Uint8Array(jsonString.length);
    for (let i = 0; i < jsonString.length; i++) {
        ret[i] = jsonString.charCodeAt(i);
    }
    return ret
};

const Document = (props) => {
    const [value, setValue] = useState('');
    let documentID = useParams().id;

    useEffect(() => {
        const editorContainer = document.getElementById('editor');
        const ydoc = new Y.Doc()
        const ytext = ydoc.getText(documentID);

        const editor = new Quill(editorContainer, {
            modules: {
                cursors: true,
                toolbar: [
                    ['bold', 'italic', 'underline']
                ],
                history: {
                    userOnly: true
                }
            },
            placeholder: 'Start collaborating...',
            theme: 'snow' // or 'bubble'
        })

        const binding = new QuillBinding(ytext, editor);

        const sse = new EventSource(urlJoin(REACT_APP_BACKEND_URL + "/api/connect/" + documentID));


        sse.onopen = () => {
            console.log("Sse open");
        }

        sse.addEventListener('sync', (event) => {
            let data = JSON.parse(event.data);
            console.log("sync");
            console.log(data);
            ytext.applyDelta(data)
        })
        sse.addEventListener('update', (event) => {
            let data = jsonStringToUint8Array(event.data);
            console.log("update");
            console.log(data);
            Y.applyUpdate(ydoc, data);
        })

        ydoc.on('update', (update, origin, doc) => {
            let message = ({
                clientID: ydoc.clientID,
                update: base64.bytesToBase64(update)
            })
            if (origin === binding) {
                axios.post('http://localhost:80/api/op/' + documentID, message)
                    .then(response => console.log(response));
            }
        })

        return () => {
            sse.close();
        };
    }, [documentID])

    return <div id={"editor"}></div>;
}
export default Document;