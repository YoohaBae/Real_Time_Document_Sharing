import {useNavigate} from 'react-router-dom';
import {useState} from "react";

const CreateDocument = () => {
    const [docID, setDocID] = useState('')
    const navigate = useNavigate();
    const handleChange = (event) => {
        setDocID(event.target.value);
    }
    const createDocument = (event) => {
        event.preventDefault();
        navigate(`/doc/${docID}`);
    }
    return (<div>
        <label htmlFor="documentID">Document ID:</label>
        <input type="text" id="documentID" name={"documentID"} onChange={handleChange}/>
        <input type="button" value="Create" onClick={createDocument}/>
    </div>)
}
export default CreateDocument;