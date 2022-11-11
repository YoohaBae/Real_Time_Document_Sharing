import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QuillBinding } from 'y-quill';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import { ImageUpload } from 'quill-image-upload';
import 'react-quill/dist/quill.snow.css';
import urlJoin from 'url-join';
import * as Y from 'yjs';
import axios from 'axios';
//import * as base64 from "byte-base64";

const { REACT_APP_BACKEND_URL } = process.env;

Quill.register('modules/cursors', QuillCursors);
Quill.register('modules/imageUpload', ImageUpload);

const jsonStringToUint8Array = (jsonString) => {
  let json = JSON.parse(jsonString);
  let clientID = json['clientID'];
  let ret = null;
  let update = json['update'];
  ret = new Uint8Array(Object.keys(update).length);
  for (let key in update) {
    // @ts-ignore
    ret[key] = update[key];
  }
  return [clientID, ret];
};

const Document = () => {
  let documentID = useParams().id;

  useEffect(() => {
    const editorContainer = document.getElementById('editor');
    let ydoc = new Y.Doc();
    // let ytext = ydoc.getText(documentID);
    const yxml = ydoc.get(documentID, Y.XmlText);

    const toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['link', 'image'],
    ];

    const editor = new Quill(editorContainer, {
      modules: {
        cursors: {
          hideDelayMs: 5000,
          hideSpeedMs: 0,
          selectionChangeSource: null,
          transformOnTextChange: true,
        },
        toolbar: toolbarOptions,
        history: {
          userOnly: true,
        },
        imageUpload: {
          customUploader: (file) => {
            let form = new FormData();
            form.append('file', file);
            console.log(form);
            axios
              .post(urlJoin(REACT_APP_BACKEND_URL, '/media/upload'), form, {
                withCredentials: true,
              })
              .then((response) => {
                console.log(response);
                const { mediaid, error } = response.data;
                if (!error) {
                  // Detail about cursor
                  const range = editor.getSelection();
                  if (range) {
                    editor.insertEmbed(
                      range.index,
                      'image',
                      `http://localhost/media/access/${mediaid}`
                    );
                  }
                }
              });
          },
        },
      },
      placeholder: 'Start collaborating...',
      theme: 'snow', // or 'bubble'
    });

    const binding = new QuillBinding(yxml, editor);
    const cursors = editor.getModule('cursors');

    const sse = new EventSource(
      urlJoin(REACT_APP_BACKEND_URL + '/api/connect/' + documentID),
      { withCredentials: true }
    );

    sse.onopen = () => {
      console.log('Sse open');
    };

    sse.addEventListener('sync', (event) => {
      const { presence } = JSON.parse(event.data);
      let [clientID, data] = jsonStringToUint8Array(event.data);
      Y.applyUpdate(ydoc, data);
      // SetTimeout to wait for applyUpdate to finish
      setTimeout(() => {
        for (let cursorData in presence) {
          console.log(presence[cursorData]);
          cursorData = presence[cursorData];
          const { sessionId, name, index, length } = cursorData;
          cursors.createCursor(sessionId, name, 'red');
          cursors.moveCursor(sessionId, { index, length });
        }
      }, 0);
    });

    sse.addEventListener('update', (event) => {
      let [clientID, data] = jsonStringToUint8Array(event.data);

      if (clientID !== ydoc.clientID) {
        Y.applyUpdate(ydoc, data);
      }
    });
    sse.addEventListener('presence', (event) => {
      console.log('Received Cursor Event');
      if (event.data) {
        const { sessionId, name, cursor } = JSON.parse(event.data);
        cursors.createCursor(sessionId, name, 'red');
        cursors.moveCursor(sessionId, cursor);
      }
    });

    ydoc.on('update', (update, origin, doc) => {
      console.log('update: ' + update);
      let message = {
        clientID: ydoc.clientID,
        //update: base64.bytesToBase64(update)
        update: update,
      };
      if (origin === binding) {
        axios
          .post(
            urlJoin(REACT_APP_BACKEND_URL, '/api/op/' + documentID),
            message,
            { withCredentials: true }
          )
          .then((response) => console.log(response));
      }
      console.log(editor.root.innerHTML);
    });

    return () => {
      sse.close();
    };
  }, [documentID]);

  return <div id={'editor'}></div>;
};
export default Document;
