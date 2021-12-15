import { createContext, useState, useEffect } from 'react'
import { provider, getAuth, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from '../services/firebase'
import Cookies from 'js-cookie';
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({children}){
    
    const auth = getAuth();
    const [user, setUser] = useState();
    const [authLoad, setAuthLoad] = useState(true);

    const signInWithGoogle = async (url) => {

        setAuthLoad(true)
                
        const signIn = await signInWithPopup(auth,provider)
            .catch(e => console.log(e)); 

        if (signIn?.user) {

            const { displayName, photoURL, uid, email } = signIn?.user;

            const getAuth = async () => {

                const { data } = await axios.post('/api/auth', { action: 'getAuth', uid: uid, email: email, name: displayName, photo: photoURL }).catch(e=>console.log(e))

                data?.token && Cookies.set('tk',data.token, { expires: 7, secure: true, sameSite: 'strict' })

                setUser({
                    uid: uid,
                    name: data?.name,
                    photo: photoURL,
                    email: email,
                    userId: parseInt(data?.userId),
                    grupo: data?.grupo,
                    isAdmin: data?.isAdmin,
                    token: data?.token
                })
                
            }
            !Cookies.get('tk') && getAuth()

        }
        setAuthLoad(false)

    }

    useEffect(() => {

        const authenticated = auth.onAuthStateChanged(userAuth => {

            if (!userAuth) {
                Cookies.remove('tk')
                setUser(null)
                setAuthLoad(false)
                return;
            }

            setAuthLoad(true)

            const { photoURL, uid, email } = userAuth;   

            const getMe = async () => {

                const { data } = await axios.post('/api/auth', { action: 'getMe', token: Cookies.get('tk') })

                setUser( 
                    { 
                        uid: uid,
                        name: data?.name,
                        photo: photoURL,
                        email: email,
                        userId: parseInt(data?.userId),
                        grupo: data?.grupo,
                        isAdmin: data?.isAdmin,
                        token: data?.token
                    }
                )

            }
            Cookies.get('tk') && getMe()

            setAuthLoad(false)

        })        

        return () => {
           authenticated()
        }

    }, [])

    const signOutGoogle = (url) => {

        setAuthLoad(true)

        signOut(auth).then(() => {
            Cookies.remove('tk')
            setUser()            
        }).catch((error) => {
            console.log(error)
        });

        setAuthLoad(false)

    }

    async function createUser(email, password) {
        
        setAuthLoad(true)
        const result = await createUserWithEmailAndPassword(auth,email,password)
            .catch(error => { return error.code });
        setAuthLoad(false)
        return result

    }

    async function loginUser(email, password) {
        
        setAuthLoad(true)
        const result = await signInWithEmailAndPassword(auth,email,password) 
            .catch(error => { return error.code });

        if (result?.user) {

            const { displayName, photoURL, uid, email } = result?.user;

            const getAuth = async () => {

                const { data } = await axios.post('/api/auth', { action: 'getAuth', uid: uid, email: email, name: displayName, photo: photoURL }).catch(e=>console.log(e))

                data?.token && Cookies.set('tk',data.token, { expires: 7, secure: true, sameSite: 'strict' })

                setUser({
                    uid: uid,
                    name: data?.name,
                    photo: photoURL,
                    email: email,
                    userId: parseInt(data?.userId),
                    grupo: data?.grupo,
                    isAdmin: data?.isAdmin,
                    token: data?.token
                })
                
            }
            !Cookies.get('tk') && getAuth()

        }
        
        setAuthLoad(false)
        
        return result    

    }

    async function resetPass(email, password) {
    
        setAuthLoad(true)
        const result = await sendPasswordResetEmail(auth,email,password)
            .catch(error => { return error.code });        
        setAuthLoad(false)
        
        return result

    }
    
    return (
        <AuthContext.Provider value={{
            user,
            signInWithGoogle,
            signOutGoogle,
            loginUser,
            createUser,
            resetPass,
            authLoad
        }}>
            {children}
        </AuthContext.Provider>
    )

}

export const AuthConsumer = AuthContext.Consumer;

export default AuthContext;