CREATE TABLE producto (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('dulce', 'salado', 'bebidas', 'desayuno', 'almuerzo', 'cena')),
    precio INT NOT NULL,
    unidades INT NOT NULL,
    imagen VARBINARY(MAX) -- guarda la imagen en binario
);



