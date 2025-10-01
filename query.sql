CREATE TABLE producto (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('dulce', 'salado', 'bebidas', 'desayuno', 'almuerzo', 'cena')),
    precio INT NOT NULL,
    unidades INT NOT NULL,
    imagen VARBINARY(MAX) -- guarda la imagen en binario
);


select * from producto;
INSERT INTO producto (nombre, categoria, precio, unidades, imagen)
SELECT 
    'Empanada', 
    'salado', 
    15000, 
    10, 
    BulkColumn 
FROM OPENROWSET(BULK 'C:\Users\YIO\Downloads\UNIDA KNELA\KNELA\img\Empanadas.png', SINGLE_BLOB) AS img;
delete from producto where id='1'

use master;
go

CREATE LOGIN [knelaadmin] WITH 
    PASSWORD=N'knela2025*', 
    DEFAULT_DATABASE=[knela], -- Establece 'knela' como la base de datos por defecto
    CHECK_EXPIRATION=OFF, 
    CHECK_POLICY=ON
GO


-- 2. Conceder el rol de administrador (sysadmin)
-- �Esto da control total sobre el servidor!
EXEC master..sp_addsrvrolemember @loginame = N'knelaadmin', @rolename = N'sysadmin'
GO

CREATE TABLE usuarios (
    id INT PRIMARY KEY IDENTITY(1,1),
    usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_registro DATETIME DEFAULT GETDATE(),
    activo BIT DEFAULT 1
);



INSERT INTO usuarios (usuario, email, password)
VALUES ('demo', 'demo@knela.com', 'demo123');