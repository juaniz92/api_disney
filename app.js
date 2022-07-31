const express = require('express');
const app = express();
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const keys = require('./settings/keys');

app.set('key', keys.key);
app.use(express.urlencoded({extended:false}));
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
app.post('/auth/register', async (req,res)=>{
    let passwordHash = await bcryptjs.hash(req.body.password, 8);
    let data = {nombreUsuario:req.body.usuario,password:passwordHash,email:req.body.email}
    let sql = "insert into usuarios set ?";
    conexion.query(sql, data, async(error, results)=>{
        if(error){
            throw error;
        }else{
            res.send(results);
        }
    });
});

//Endpoint autenticación login
app.post('/auth/login', async (req,res)=>{
    const usuario = req.body.usuario;
    const password = req.body.password;
    let passwordHash = await bcryptjs.hash(password, 8);
    if(usuario && password){
        conexion.query('select * from usuarios where nombreUsuario = ?', [usuario], async(error, results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(password, results[0].password))){
                res.send('Usuario o password incorrectos!');
            }else{
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
            }
        })
    }else{
        res.send('Ingrese usuario y password');
    }
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
    let nombre = req.body.nombre;
    let edad = req.body.edad;
    let peso = req.body.peso;
    let historia = req.body.historia;
    let imagen = req.body.imagen;
    let peliculas_asociadas = req.body.pelicula_asociada;
    let sql = "update personajes set nombre = ?, edad = ?, peso = ?, historia = ?, imagen = ?, peliculas_asociadas = ? where id = ?";
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

//Búsqueda de personaje por nombre
app.get('/characters?name=nombre', (req,res)=>{
    conexion.query('select * from personajes where nombre = ?',[req.params.name], (error,fila)=>{
        if(error){
            throw error;
        }else{
            res.send(fila);
        }
    });
});

//Filtrar personaje por edad
app.get('/characters?age=edad', (req,res)=>{
    conexion.query('select * from personajes where edad = ?',[req.params.edad], (error,fila)=>{
        if(error){
            throw error;
        }else{
            res.send(fila);
        }
    });
});

//Filtrar personaje por película asociada
app.get('/characters?movies=idMovie', (req,res)=>{
    conexion.query('select * from personajes where peliculas_asociadas = ?',[req.params.idMovie], (error,fila)=>{
        if(error){
            throw error;
        }else{
            res.send(fila);
        }
    });
});

//Mostrar pelicula
app.get('/movies', (req,res)=>{
    conexion.query('select imagen, titulo, fecha_creacion from pelicula_series',(error,filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    });
});

//Detalle pelicula
app.get('/detallepelicula/:id', (req,res)=>{
    conexion.query('select * from pelicula_series where id = ?',[req.params.id], (error,fila)=>{
        if(error){
            throw error;
        }else{
            res.send(fila);
        }
    });
});

//Crear pelicula
app.post('/crearpelicula', (req,res)=>{
    let data = {titulo:req.body.titulo,fecha_creacion:req.body.fecha_creacion,calificacion:req.body.calificacion,personaje_asociado:req.body.personaje_asociado}
    let sql = "insert into pelicula_series set ?";
    conexion.query(sql, data, function(error, results){
        if(error){
            throw error;
        }else{
            res.send(results);
        }
    });
});

//Editar pelicula
app.put('/editarpelicula/:id',(req,res)=>{
    let id = req.params.id;
    let titulo = req.body.titulo;
    let fecha_creacion = req.body.fecha_creacion;
    let calificacion = req.body.calificacion;
    let imagen = req.body.imagen;
    let personaje_asociado = req.body.personaje_asociado;
    let sql = "update pelicula_series set titulo = ?, fecha_creacion = ?, calificacion = ?, imagen = ?, personaje_asociado = ? where id = ?";
    conexion.query(sql, [titulo, fecha_creacion, calificacion, imagen, personaje_asociado, id],function(error,results){
        if(error){
            throw error;
        }else{
            res.send(results);
        }
    });
});

//Eliminar pelicula
app.delete('/eliminarpelicula/:id', (req,res)=>{
    conexion.query('delete from pelicula_series where id = ?',[req.params.id], function(error,filas){
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    });
});

//Búsqueda de película por título
app.get('/movies?name=nombre', (req,res)=>{
    conexion.query('select * from pelicula_series where titulo = ?',[req.params.nombre], (error,fila)=>{
        if(error){
            throw error;
        }else{
            res.send(fila);
        }
    });
});

//Filtrar película por género
app.get('/movies?genre=idGenero', (req,res)=>{
    conexion.query('select * from pelicula_series, genero where id_genero = ?',[req.params.idGenero], (error,fila)=>{
        if(error){
            throw error;
        }else{
            res.send(fila);
        }
    });
});

//Ordenar por fecha de creación
app.get('/movies?order=ASC | DESC', (req,res)=>{
    conexion.query('select * from pelicula_series where titulo = ?',[req.params.order], (error,fila)=>{
        if(error){
            throw error;
        }else{
            res.send(fila);
        }
    });
});