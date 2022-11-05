import {useNavigate} from 'react-router-dom';
import {useState} from "react";

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate();
    const handleEmailChange  = (event) => {
        set(event.target.value);
    }
    const handlePasswordChange  = (event) => {
        set(event.target.value);
    }
    const login = (event) => {
        event.preventDefault();
    }
    return (<div>
        <label htmlFor="userName">Document ID:</label>
        <input type="text" id="email" name={"Email"} onChange={handleEmailChange}/>
        <input type="password" id="password" name={"Password"} onChange={handlePasswordChange}/>
        <input type="button" value="Open" onClick={login}/>
    </div>)
}
export default Login;