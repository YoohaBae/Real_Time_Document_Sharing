import React, {useEffect, useState} from 'react';
import {useQuill} from 'react-quilljs';
import {useParams} from 'react-router-dom';
import {QuillBinding} from 'y-quill';
import QuillCursors from 'quill-cursors';
import {ImageUpload} from 'quill-image-upload';
import 'react-quill/dist/quill.snow.css';
import urlJoin from 'url-join';
import * as Y from 'yjs';
import axios from 'axios';

const {REACT_APP_BACKEND_URL} = process.env;

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
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    ['link', 'image'],
  ];

  const {quill, quillRef, Quill} = useQuill(
      {
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
            customUploader: {}
          },

        },
        placeholder: 'Start collaborating...',
        theme: 'snow', // or 'bubble'
      }
  );
  if (Quill && !quill) {
    Quill.register('modules/cursors', QuillCursors);
    Quill.register('modules/imageUpload', ImageUpload);
  }
  useEffect(() => {
    if (quill) {
      const customUploader = (file) => {
        console.log("custom Uploader")
        let form = new FormData();
        form.append('file', file);
        axios.post(urlJoin(REACT_APP_BACKEND_URL, '/media/upload'), form, {
          withCredentials: true,
        })
            .then((response) => {
              console.log(response);
              const {mediaid, error} = response.data;
              if (!error) {
                // Detail about cursor
                const range = quill.getSelection(true);
                if (range) {
                  quill.insertEmbed(
                      range.index,
                      'image',
                      `http://localhost/media/access/${mediaid}`
                  );
                }
              }
            });

      }
      console.log(quill.getModule('imageUpload').options);
      quill.getModule('imageUpload').options.customUploader = customUploader;
      console.log(quill.getModule('imageUpload'))
      let ydoc = new Y.Doc();
      // let ytext = ydoc.getText(documentID);
      const yxml = ydoc.get(documentID, Y.XmlText);
      const binding = new QuillBinding(yxml, quill);
      const cursors = quill.getModule('cursors');

      const sse = new EventSource(
          urlJoin(REACT_APP_BACKEND_URL + '/api/connect/' + documentID),
          {withCredentials: true}
      );

      sse.onopen = () => {
        console.log('Sse open');
      };

      sse.addEventListener('sync', async (event) => {
        const {presence} = JSON.parse(event.data);
        let [clientID, data] = jsonStringToUint8Array(event.data);
        await Y.applyUpdate(ydoc, data);
        cursors.clearCursors();
        // SetTimeout to wait for applyUpdate to finish
        // setTimeout(() => {
        //   for (let cursorData in presence) {
        //     console.log(presence[cursorData]);
        //     cursorData = presence[cursorData];
        //     const {sessionId, name, index, length} = cursorData;
        //     cursors.createCursor(sessionId, name, "red");
        //     cursors.moveCursor(sessionId, {index, length});
        //   }
        // }, 0);
      });

      sse.addEventListener('update', (event) => {
        let [clientID, data] = jsonStringToUint8Array(event.data);

        if (clientID !== ydoc.clientID) {
          Y.applyUpdate(ydoc, data);
        }
      });
      sse.addEventListener('presence', (event) => {
        console.log('Received Cursor Event');
        console.log(event.data)
        setTimeout(() => {
          if (event.data) {
            const {sessionId, name, cursor} = JSON.parse(event.data);
            cursors.createCursor(sessionId, name, 'red');
            cursors.moveCursor(sessionId, cursor);
          }
        }, 0)
      });

      quill.on('selection-change', function (range, oldRange, source) {
        if (range) {
          let selection = quill.getSelection(true);
          let body = {
            "index": selection.index,
            "length": selection.length
          }
          axios.post(urlJoin(REACT_APP_BACKEND_URL, "/api/presence/" + documentID), body, {withCredentials: true}).then((response) => {
            console.log(response)
          })
        } else {
          console.log('Cursor not in the quill');
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
                  {withCredentials: true}
              )
              .then((response) => console.log(response));
        }
        console.log(quill.root.innerHTML);
      });

      return () => {
        sse.close();
      };
    }
  }, [quill]);

  return (
      <div style={{width: 500, height: 300}}>
        <div ref={quillRef}/>
      </div>
  );
};
export default Document;
