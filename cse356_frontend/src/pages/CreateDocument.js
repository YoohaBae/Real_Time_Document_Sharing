import {useNavigate} from 'react-router-dom';
import {useState, useEffect} from "react";
import urlJoin from "url-join";
import axios from 'axios';

const {REACT_APP_BACKEND_URL} = process.env;

const CreateDocument = () => {
    const [documentName, setDocumentName] = useState('')
    const [documents, setDocuments] = useState([]);
    const navigate = useNavigate();
    const handleChange = (event) => {
        event.preventDefault();
        setDocumentName(event.target.value);
    }
    const getRecentDocuments = (event) => {
        axios.get(urlJoin(REACT_APP_BACKEND_URL, "/collection/list"), {withCredentials: true, credentials: "include"}).then(response => {
            if (response.data.error) {
                console.log("error");
            }
            else {
                setDocuments(response.data);
            }
        })
    }
    const createDocument = (event) => {
        let body = {
            "name": documentName
        }
        axios.post(urlJoin(REACT_APP_BACKEND_URL, "/collection/create"), body, {withCredentials: true, credentials: "include"}).then(response => {
            getRecentDocuments();
        })
    }

    const openDocument = (id) => {
        navigate("/edit/" + id);
    }

    const deleteDocument = (id) => {
        let body = {
            "id": id
        }
        axios.post(urlJoin(REACT_APP_BACKEND_URL, "/collection/delete"), body, {withCredentials: true, credentials: "include"}).then(response => {
            console.log(response);
            getRecentDocuments();
        })
    }
    const logout = () => {
        axios.post(urlJoin(REACT_APP_BACKEND_URL, "/users/logout"), {}, {withCredentials: true, credentials: "include"}).then(response => {
            console.log("logged out");
        })
    }
    useEffect(() => {
        getRecentDocuments();
    }, [])
    return (<div>
        <div>
            {documents.map((data) => {
                return (
                    <div key={data.id}>
                        <a onClick={() => openDocument(data.id)}>{data.name}</a>
                        <button onClick={() => deleteDocument(data.id)}>Delete</button>
                    </div>)
            })}
        </div>
        <h1>Create Document</h1>
        <form>
            <label htmlFor="documentName">Document Name:</label>
            <input type="text" id="documentName" name={"documentName"} onChange={handleChange}/>
            <input type="button" value="Create" onClick={createDocument}/>
        </form>
        <button onClick={() => logout()}>Logout</button>
    </div>)
}
export default CreateDocument;