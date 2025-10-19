const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(cors());

// Servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname)));

// Ruta raíz - Redirigir al login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login', 'loginUnida.html'));
});

// Configuración SQL Server
const config = {
    user: 'knela',
    password: 'knela2025*', 
    server: 'YIO',
    database: 'knela',
    options: {
        encrypt: false, 
        trustServerCertificate: true 
    }
};

// ========================================
// RUTAS DE AUTENTICACIÓN
// ========================================

// 🔹 REGISTRO DE USUARIO
// 📹 REGISTRO DE USUARIO
app.post('/api/auth/registro', async (req, res) => {
    const { usuario, email, password, tipo } = req.body; // 👈 Agregar tipo
    
    // Validaciones básicas
    if (!usuario || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos son requeridos' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'La contraseña debe tener al menos 6 caracteres' 
        });
    }

    // Validar tipo de usuario
    const tipoUsuario = tipo || 'alumno'; // Por defecto alumno
    if (!['alumno', 'profesor'].includes(tipoUsuario)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tipo de usuario inválido' 
        });
    }

    try {
        let pool = await sql.connect(config);
        
        // Verificar si el usuario ya existe
        let checkUser = await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .input('email', sql.VarChar, email)
            .query("SELECT * FROM usuarios WHERE usuario=@usuario OR email=@email");

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El usuario o email ya existe' 
            });
        }

        // Insertar nuevo usuario con tipo
        await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .input('tipo', sql.VarChar, tipoUsuario) // 👈 NUEVO
            .query("INSERT INTO usuarios (usuario, email, password, tipo) VALUES (@usuario, @email, @password, @tipo)");

        res.json({ 
            success: true, 
            message: 'Usuario registrado exitosamente' 
        });

    } catch (err) {
        console.error("Error en registro:", err.message);
        res.status(500).json({ 
            success: false, 
            message: "Error al registrar usuario: " + err.message 
        });
    }
});

// 🔹 LOGIN DE USUARIO (ANTERIOR)
app.post('/api/auth/login', async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Usuario y contraseña son requeridos' 
        });
    }

    try {
        let pool = await sql.connect(config);
        
        // Buscar usuario (puede ser por usuario o email)
        let result = await pool.request()
            .input('usuario', sql.VarChar, usuario)
            .query("SELECT * FROM usuarios WHERE (usuario=@usuario OR email=@usuario) AND activo=1");

        if (result.recordset.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        const user = result.recordset[0];

        // Verificar contraseña
        if (user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Contraseña incorrecta' 
            });
        }

        // Login exitoso
        res.json({ 
            success: true, 
            message: 'Login exitoso',
            usuario: {
                id: user.id,
                usuario: user.usuario,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Error en login:", err.message);
        res.status(500).json({ 
            success: false, 
            message: "Error al iniciar sesión: " + err.message 
        });
    }
});

// 🔹 LOGIN PARA LA TIENDA (NUEVO) - Con email
// 📹 LOGIN PARA LA TIENDA (ACTUALIZADO)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔍 Intento de login:', email);
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son requeridos' 
            });
        }
        
        let pool = await sql.connect(config);
        
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`
                SELECT id, usuario, email, password, tipo 
                FROM usuarios 
                WHERE email = @email AND activo = 1
            `);
        
        if (result.recordset.length === 0) {
            console.log('❌ Usuario no encontrado o inactivo');
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado o no activo' 
            });
        }
        
        const usuario = result.recordset[0];
        
        if (password !== usuario.password) {
            console.log('❌ Contraseña incorrecta');
            return res.status(401).json({ 
                success: false, 
                message: 'Contraseña incorrecta' 
            });
        }
        
        console.log('✅ Login exitoso para:', usuario.usuario);
        
        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: usuario.id,
                nombre: usuario.usuario,
                email: usuario.email,
                tipo: usuario.tipo || 'alumno' // 👈 NUEVO
            }
        });
        
    } catch (error) {
        console.error('💥 Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor: ' + error.message
        });
    }
});




// 📹 OBTENER USUARIO POR ID (ACTUALIZADO)
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        console.log('👤 Obteniendo usuario con ID:', userId);
        
        let pool = await sql.connect(config);
        
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query(`
                SELECT id, usuario, email, tipo 
                FROM usuarios 
                WHERE id = @id AND activo = 1
            `);
        
        if (result.recordset.length === 0) {
            console.log('❌ Usuario no encontrado');
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        const usuario = result.recordset[0];
        
        console.log('✅ Usuario encontrado:', usuario.usuario);
        
        res.json({
            id: usuario.id,
            nombre: usuario.usuario,
            email: usuario.email,
            tipo: usuario.tipo || 'alumno', // 👈 NUEVO
            verificado: true
        });
        
    } catch (error) {
        console.error('💥 Error al obtener usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor: ' + error.message
        });
    }
});

// ========================================
// RUTAS DE PRODUCTOS (EXISTENTES)
// ========================================

// 🔹 OBTENER TODOS LOS PRODUCTOS
app.get('/api/productos', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM producto");
        
        const productosConImagenes = result.recordset.map(producto => {
            let imagenBase64 = null;
            
            if (producto.imagen && producto.imagen.length > 0) {
                imagenBase64 = `data:image/jpeg;base64,${producto.imagen.toString('base64')}`;
            }

            return {
                ...producto,
                imagen: imagenBase64
            };
        });

        res.json(productosConImagenes);

    } catch (err) {
        console.error("Error en GET /api/productos:", err.message);
        res.status(500).send("Error al obtener productos: " + err.message);
    }
});

// 🔹 CREAR NUEVO PRODUCTO
app.post('/api/productos', async (req, res) => {
    const { nombre, categoria, precio, unidades, imagen, disponible_para } = req.body;
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('categoria', sql.VarChar, categoria)
            .input('precio', sql.Int, precio)
            .input('unidades', sql.Int, unidades)
            .input('imagen', sql.VarBinary, imagen ? Buffer.from(imagen.split(',')[1], 'base64') : null)
            .input('disponible_para', sql.VarChar, disponible_para)
            .query("INSERT INTO producto (nombre, categoria, precio, unidades, imagen, disponible_para) VALUES (@nombre, @categoria, @precio, @unidades, @imagen, @disponible_para)");
        res.send("Producto agregado");
    } catch (err) {
        console.error("Error en POST /api/productos:", err.message);
        res.status(500).send("Error al crear producto: " + err.message);
    }
});

// 🔹 ACTUALIZAR PRODUCTO
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, precio, unidades, imagen, disponible_para } = req.body;
    try {
        let pool = await sql.connect(config);
        
        let query = `UPDATE producto SET 
                        nombre=@nombre, 
                        categoria=@categoria, 
                        precio=@precio, 
                        unidades=@unidades,
                        disponible_para=@disponible_para,
                        imagen=${imagen ? '@imagen' : 'imagen'} 
                    WHERE id=@id`;

        let request = pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('categoria', sql.VarChar, categoria)
            .input('precio', sql.Int, precio)
            .input('unidades', sql.Int, unidades)
            .input('disponible_para', sql.VarChar, disponible_para);
            
        if (imagen) {
            request = request.input('imagen', sql.VarBinary, Buffer.from(imagen.split(',')[1], 'base64'));
        }

        await request.query(query);

        res.send("Producto actualizado");
    } catch (err) {
        console.error("Error en PUT /api/productos/:id:", err.message);
        res.status(500).send("Error al actualizar producto: " + err.message);
    }
});
// 🔹 ELIMINAR PRODUCTO
app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(config);
        await pool.request().input('id', sql.Int, id).query("DELETE FROM producto WHERE id=@id");
        res.send("Producto eliminado");
    } catch (err) {
        console.error("Error en DELETE /api/productos/:id:", err.message);
        res.status(500).send("Error al eliminar producto: " + err.message);
    }
});

// 🔹 INICIO DEL SERVIDOR
app.listen(3000, () => {
    console.log("\n🚀 ========================================");
    console.log("   Servidor Knela iniciado con éxito");
    console.log("🚀 ========================================");
    console.log("📍 URL: http://localhost:3000/login/Login.html");
    console.log("========================================\n");
});