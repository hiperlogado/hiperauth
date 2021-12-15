import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from "../hooks/useAuth";
import styles from '../styles/Home.module.css';

const Login = () => {
    
    const { user, signInWithGoogle, signOutGoogle, createUser, loginUser, resetPass, authLoad } = useAuth();
    const [option,setOption] = useState('access');
    const [email,setEmail] = useState();
    const [password,setPassword] = useState();    
    const [response,setResponse] = useState([]);

    const responses = {
        'all_fields':'Preencha todos os campos.',
        'login_error':'Usuário e/ou senha incorreto(s).',
        'email_error':'Formato de email inválido.',
        'email_required':'Informe o email',
        'email_registered':'Email já registrado.',
        'email_format':'Formato de email inválido.',
        'email_not_found':'Email não encontrado.',
        'pass_format':<>A senha precisa ter<br /> pelo menos 6 caracteres, <br />com números, letras maiúsculas<br /> e minúsculas.</>,
        'email_sent':<>Email de redefinição de senha<br />enviado com sucesso.</>
    }

    const sendAccess = async (e) => {

        e.preventDefault()

        if(!email || !password) return setResponse([responses.all_fields,'e']);
        
        const access = await loginUser(email,password)        

        if(access=='auth/wrong-password' || access=='auth/user-not-found' || access=='auth/invalid-email' || !isEmail(email)) return setResponse([responses.login_error,'e']);
        
    }

    const sendSignup = async (e) => {

        e.preventDefault()
                
        if(!email || !password) return setResponse([responses.all_fields,'e']);
        if(!isEmail(email)) return setResponse([responses.email_format,'e']);
        if(!isValidPass(password)) return setResponse([responses.pass_format,'e']);

        const create = await createUser(email,password)
        if(create=='auth/email-already-in-use') return setResponse([responses.email_registered,'e']);
        
    }

    const sendPassword = async (e) => {

        e.preventDefault()        
                
        if(!email) return setResponse([responses.email_required,'e']);
        
        const reset = await resetPass(email,password)
        
        if(reset=='auth/invalid-email' || reset=='invalid-continue-uri' || reset=='auth/user-not-found' || !isEmail(email)) return setResponse([responses.email_not_found,'e']);
        
        setOption('access')
        return setResponse([responses.email_sent,'s']);
        
    }

    const isEmail = (e) => {
        var filter = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return String(e).search (filter) != -1;
    }

    const isValidPass = (e) => {
        var filter = /^(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z$*&@#]{6,}$/;
        return String(e).search (filter) != -1;
    }

    return (
        <>
            {authLoad && <style jsx global>{`
            body {
                overflow: hidden;
            }
            `}</style>}
            {authLoad && <div className={styles.backdrop}></div>}
            <div className={styles.container}>            
                <main className={styles.main}>
                    <h1 className={styles.title}>
                        hiperAuth
                    </h1>
                    <p className={styles.description}>                
                    <code className={styles.code}>nextjs+firebase+strapi</code>
                    </p>
                    <div className={styles.card}>
                        {authLoad && <div className={styles.loading}><Image src="/loading.gif" alt="Loading" width={50} height={50} /></div>}
                        {!user ? <button onClick={signInWithGoogle} className={styles.input}>Entrar com Google</button> : <>Olá, {user.name} <button onClick={()=>signOutGoogle('/')} className={styles.input}>Sair</button></>}
                                            
                        <form onSubmit={option=='access' ? sendAccess : option=='signup' ? sendSignup : sendPassword} action="#">
                        {!user && <>
                            <div>--------- Ou ---------</div>
                            <br />
                            <div className={styles.inputs}>
                                <div className={styles.subtitle}>{option=='access' ? 'Acessar' : option=='password' ? 'Redefinir Senha' : 'Cadastrar Usuário' }</div>
                                <input type="text" onChange={e => setEmail(e.target.value)} name="user" className={styles.input} placeholder='Email' />
                                {option!='password' && <input type="password" onChange={e => setPassword(e.target.value)} name="password" className={styles.input} placeholder='Senha' />}
                                <button type="submit" className={styles.input}>{option=='access' ? 'Entrar' : option=='password' ? 'Enviar' : 'Cadastrar' }</button>
                            </div>
                            <div className={styles.response} style={response[1]!='e' ? { color: '#0a0' } : {} }>
                                {response[0]}
                            </div>
                            <hr />
                            <div>Mais opções</div>
                            <br />
                            <div>
                                {option=='access' && <div className={styles.links}>
                                    <a href="#" onClick={()=>[setOption('signup'),setResponse([])]}>Cadastro</a>
                                    <a href="#" onClick={()=>[setOption('password'),setResponse([])]}>Redefinir a senha</a>
                                </div>}
                                {option=='signup' && <div className={styles.links}>
                                    <a href="#" onClick={()=>[setOption('access'),setResponse([])]}>Acesso</a>
                                    <a href="#" onClick={()=>[setOption('password'),setResponse([])]}>Redefinir senha</a>
                                </div>}
                                {option=='password' && <div className={styles.links}>  
                                    <a href="#" onClick={()=>[setOption('signup'),setResponse([])]}>Cadastro</a>
                                    <a href="#" onClick={()=>[setOption('access'),setResponse([])]}>Acesso</a>
                                </div>}
                            </div>
                            </>}
                        </form>                    
                    </div>
                </main>
                <footer className={styles.footer}>
                    Powered by hiperlogado
                </footer>
            </div> 
        </>
    )
 
}

export default Login;