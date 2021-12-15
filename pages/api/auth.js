import axios from 'axios';

const getAuth = async (email) => {

  const { data } = await axios.post(process.env.STRAPI_GRAPHQL_URL, {
      query: `mutation {
        login(input: {identifier: "${email}", password: "${process.env.STRAPI_PASSWORD}"}) {
          jwt
        }
      }`
    }, { headers: { 'Content-Type':'application/json' }}
  ).catch(e=>console.log(e.response.data.errors));

  const dataMe = data?.data && await getMe(data?.data?.login.jwt)

  return dataMe ?? {};
  
}

const findAccount = async (email,token) => {

  const { data } = await axios.post(process.env.STRAPI_GRAPHQL_URL,{
      query: `{
        cadastros(where: { email_eq: "${email}" }, publicationState: PREVIEW) {
          id, nome, grupo, isAdmin
        }
      }`
    },{ headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` }}
  ).catch(e=>console.log(e.response.data.errors));

  return data?.data?.cadastros?.[0]

}

const createAccount = async (userId,email,name,uid,photo,token) => {

  const { data } = await axios.post(process.env.STRAPI_GRAPHQL_URL, {
      query: `mutation createCadastro {
        createCadastro(input: { data: {user: "${userId}", nome: "${name}", email: "${email}", uid: "${uid}", foto: "${photo}", grupo: Visitante, isAdmin: ${process.env.STRAPI_IDENTIFIER==email}}}){
          cadastro {
            id
          }
        }
      }`
    }, { headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` } }
  ).catch(e=>console.log(e.response.data.errors));

  return data?.data?.createCadastro?.cadastro

}

const updateAccount = async (userId,accountId,email,name,uid,photo,token) => {

  await axios.post(process.env.STRAPI_GRAPHQL_URL, {
      query: `mutation updateCadastro {
        updateCadastro( input: { where: { id: ${accountId} }, data: {user: ${userId}, uid: "${uid}", foto: "${photo}"}}){
          cadastro {
            id
          }
        }
      }`
    }, { headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` } }
  ).catch(e=>console.log(e.response.data.errors));

}

const updateUser = async (userId,accountId,token) => {

  await axios.post(process.env.STRAPI_GRAPHQL_URL, {
      query: `mutation updateUser {
        updateUser( input: { where: { id: ${userId} }, data: {cadastro: ${accountId}}}){
          user {
            id
          }
        }
      }`
    }, { headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` } }
  ).catch(e=>console.log(e.response.data.errors));

}

const getMe = async (token) => {

  const { data } = await axios.post(process.env.STRAPI_GRAPHQL_URL, {
      query: `{
        me {
          user {
            id
            cadastro {
              nome
              grupo
              isAdmin
            }
          }
        }
      }`
    }, { headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` } }
  ).catch(e=>console.log(e.response.data.errors));

  return { 
    userId: data?.data?.me?.user.id, 
    name: data?.data?.me?.user?.cadastro?.nome, 
    grupo: data?.data?.me?.user?.cadastro?.grupo, 
    isAdmin: data?.data?.me?.user?.cadastro?.isAdmin,
    token: token 
  }

}

const setRegister = async (email,name,uid,photo,token) => {

  const dataAccount = await findAccount(email,token)

  if(process.env.STRAPI_IDENTIFIER==email || token){

    const createUser = await axios.post(process.env.STRAPI_REST_URL + 'auth/local/register', {
      username: email,
      email: email,
      role: process.env.STRAPI_IDENTIFIER==email ? 3 : dataAccount ? 1 : 2,
      password: process.env.STRAPI_PASSWORD,
      secret: process.env.STRAPI_PASSWORD
    });
  
    if(!dataAccount){

      const dataCreateAccount = await createAccount(createUser?.data?.user?.id,email,name,uid,photo,token ?? createUser?.data?.jwt)      
      updateUser(createUser?.data?.user?.id,dataCreateAccount?.id,token ?? createUser?.data?.jwt)

    } else {

      updateAccount(createUser?.data?.user?.id,dataAccount.id,email,name,uid,photo,token ?? createUser?.data?.jwt)
      updateUser(createUser?.data?.user?.id,dataAccount.id,token ?? createUser?.data?.jwt)
      
    }

    return {
      userId: createUser?.data?.user?.id,      
      name: dataAccount?.nome ?? name,
      grupo: dataAccount?.grupo ?? 'Visitante',
      isAdmin: process.env.STRAPI_IDENTIFIER==email,
      token: createUser?.data?.jwt
    };
  
  }

}

const Auth = async (req,res) => {

    const  { action, uid, name, email, photo, token } = req.body;
  
    if(action=='getAuth'){

        const dataAuth = await getAuth(email)

        if(!dataAuth?.token){

          const dataAdminAuth = await getAuth(process.env.STRAPI_IDENTIFIER)
          const dataRegister = await setRegister(email,name ?? email.split('@')[0],uid,photo ?? '',dataAdminAuth?.token)

          res.status(200).json(dataRegister)

        } else {

          res.status(200).json(dataAuth)

        }

    }

    if(action=='getMe'){

      const dataMe = await getMe(token)      
      res.status(200).json(dataMe)

    }

    res.end()

}

export default Auth;