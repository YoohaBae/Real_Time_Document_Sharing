import {useNavigate} from 'react-router-dom';
import {useState} from "react";

const Auth = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate();
    const handleNameChange  = (event) => {
        set(event.target.value);
    }
    const handleEmailChange  = (event) => {
        set(event.target.value);
    }
    const handlePasswordChange  = (event) => {
        set(event.target.value);
    }
    const createUser = (event) => {
        event.preventDefault();
    }
    return (<div>
        <label htmlFor="userName">Document ID:</label>
        <input type="text" id="name" name={"Name"} onChange={handleNameChange}/>
        <input type="text" id="email" name={"Email"} onChange={handleEmailChange}/>
        <input type="password" id="password" name={"Password"} onChange={handlePasswordChange}/>
        <input type="button" value="Open" onClick={createUser}/>
    </div>)
}
export default Auth;