import {useNavigate} from 'react-router-dom';
import {useState} from "react";
import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate();
    const handleEmailChange  = (event) => {
        setEmail(event.target.value);
    }
    const handlePasswordChange  = (event) => {
        setPassword(event.target.value);
    }
    const login = (event) => {
        event.preventDefault();
        let userInfo = {
            "email": email,
            "password": password
        }
        axios.post('http://localhost:80/users/login', userInfo)
            .then(response => console.log(response));
    }
    return (<div>
        <h1>Login</h1>
        <label htmlFor="email">Email:</label>
        <input type="text" id="email" name={"Email"} onChange={handleEmailChange}/>
        <br/>
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name={"Password"} onChange={handlePasswordChange}/>
        <input type="button" value="Open" onClick={login}/>
    </div>)
}
export default Login;