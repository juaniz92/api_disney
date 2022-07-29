const express = require('express');
const app = express();
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

const keys = require('./settings/keys');

app.set('key', keys.key);
app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use(express.json());

//Parámetros de conexión
const conexion = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'database_disney'
});

conexion.connect(function(error){
    if(error){
        throw error;
    }else{
        console.log('Conexión exitosa');
    }
});

//Endpoint registrar usuarios
app.post('/auth/register', (req,res)=>{
    let data = {nombreUsuario:req.body.nombreUsuario,password:req.body.password,email:req.body.email}
    let sql = "insert into usuarios set ?";
    conexion.query(sql, data, function(error, results){
        if(error){
            throw error;
        }else{
            res.send(results);
        }
    });
});

//Endpoint login
/*app.post('/auth/login', (req,res)=>{
    if(req.body.usuario == 'admin' && req.body.password == '12345'){
        const payload = {
            check:true
        };
        const token = jwt.sign(payload, app.get('key'),{
            expiresIn:'7d'
        });
        res.json({
            message:'Autenticación exitosa',
            token: token
        });
    }else{
        res.json({
            message:'Login incorrecto'
        })
    }
});*/

app.post('/auth/login', (req,res)=>{
    const usuario = req.body.usuario;
    const password = req.body.password;
    if(conexion.query('select * from usuarios where nombreUsuario = ?', [usuario])){
        if(conexion.query('select * from usuarios where password = ?', [password])){
            res.send('Login correcto!');
        }else{
            res.send('usuario o password incorrecto');
        }
    }
    /*if(usuario && password){
        conexion.query('select * from usuarios where nombreUsuario = ?', [usuario], (error, results)=>{
            if(!usuario || !password){
                res.send('usuario o password incorrecto');
            }else{
                res.send('Login correcto!');
            }
        })*/

        
        /*const payload = {
            check:true
        };
        const token = jwt.sign(payload, app.get('key'),{
            expiresIn:'7d'
        });
        res.json({
            message:'Autenticación exitosa',
            token: token
        });*/
    /*}else{
        res.json({
            message:'Login incorrecto'
        })
    }*/
});

//Middleware
const verificacion = express.Router();

verificacion.use((req,res,next)=>{
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    //console.log(token);
    if(!token){
        res.status(401).send({
            error:'Es necesario token de autenticación'
        })
        return
    }
    if(token.startsWith('Bearer ')){
        token = token.slice(7, token.length);
        console.log(token);
    }
    if(token){
        jwt.verify(token, app.get('key'), (error, decoded)=>{
            if(error){
                return res.json({
                    message:'El token no es válido'
                });
            }else{
                req.decoded = decoded;
                next();
            }
        });
    }
});

//Mostrar personajes
app.get('/characters', (req,res)=>{
    conexion.query('select imagen, nombre from personajes',(error,filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    });
});

//Crear personaje
app.post('/crearpersonaje', (req,res)=>{
    let data = {nombre:req.body.nombre,edad:req.body.edad,peso:req.body.peso,historia:req.body.historia,peliculas_asociadas:req.body.pelicula_asociada}
    let sql = "insert into personajes set ?";
    conexion.query(sql, data, function(error, results){
        if(error){
            throw error;
        }else{
            res.send(results);
        }
    });
});

//Editar personaje
app.put('/editarpersonaje/:id',(req,res)=>{
    let id = req.params.id;
    let nombre = req.params.nombre;
    let edad = req.params.edad;
    let peso = req.params.peso;
    let historia = req.params.historia;
    let imagen = req.params.imagen;
    let peliculas_asociadas = req.params.pelicula_asociada;
    let sql = "update personajes set nombre = ?, edad = ?, peso = ?, historia = ?, peliculas_asociadas = ? where id = ?";
    conexion.query(sql, [nombre, edad, peso, historia, imagen, peliculas_asociadas, id],function(error,results){
        if(error){
            throw error;
        }else{
            res.send(results);
        }
    });
});

//Eliminar personaje
app.delete('/eliminarpersonaje/:id', (req,res)=>{
    conexion.query('delete from personajes where id = ?',[req.params.id], function(error,filas){
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    });
});

//Detalle personaje
app.get('/detallepersonaje/:id', (req,res)=>{
    conexion.query('select * from personajes where id = ?',[req.params.id], (error,fila)=>{
        if(error){
            throw error;
        }else{
            res.send(fila);
        }
    });
});

app.get('/info', verificacion, (req,res)=>{
    res.json('Informacion entregada');
})

app.get('/',function(req,res){
    res.send('Ruta inicio');
})

const puerto = process.env.PUERTO || 3000;

app.listen(puerto,function(){
    console.log('Server OK en puerto: '+puerto);
})