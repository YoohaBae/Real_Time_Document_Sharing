import React from "react";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import './App.css';
import StartPage from "./pages/StartPage";
import Document from "./pages/Document";
import CreateDocument from "./pages/CreateDocument";
import Auth from "./pages/Auth";
import Login from "./pages/Login";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<StartPage/>}/>
                <Route path="/doc/:id" element={<Document/>}/>
                <Route path="/doc" element={<CreateDocument/>}/>
                <Route path="/auth" element={<Auth/>}/>
                <Route path="/login" element={<Login/>}/>
            </Routes>
        </Router>
    );
}

export default App;
