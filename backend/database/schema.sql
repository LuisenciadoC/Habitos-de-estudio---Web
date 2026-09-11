--------------1. Creacion de BD--------------
CREATE DATABASE HabitosEstudio;
GO

USE HabitosEstudio;
GO

--------------2. Cracion de tablas--------------

--------2.1 Tabla Usuarios--------
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY IDENTITY(1,1),
    apodo_usuario VARCHAR(25) NOT NULL UNIQUE,
    nombre_usuario VARCHAR(100) NOT NULL,
    correo_usuario VARCHAR(150) NOT NULL UNIQUE,
    contrasena_usuario VARCHAR(255) NOT NULL,
    fecha_registro DATETIME DEFAULT GETDATE(),
    fecha_nacimiento_usuario DATE NOT NULL,
    url_foto_usuario VARCHAR(255) NULL
);

--------2.2 Tabla Tareas--------
CREATE TABLE Tareas (
    id_tarea INT PRIMARY KEY IDENTITY(1,1),
    nombre_tarea VARCHAR(100) NOT NULL UNIQUE,
    descripcion_tarea VARCHAR(255) NULL,
    tarea_completada BIT DEFAULT 0,
    
    id_usuario INT NOT NULL,
    CONSTRAINT FK_Tareas_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

--------2.3 Tabla Habitos--------
CREATE TABLE Habitos (
    id_habito INT IDENTITY(1,1) PRIMARY KEY,
    nombre_habito VARCHAR(100) NOT NULL,
    racha_actual_habito INT DEFAULT 0,

    id_usuario INT NOT NULL,
    CONSTRAINT FK_Habitos_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

--------2.4 Tabla Registro de Habitos--------
CREATE TABLE Registros_Habitos (
    id_registro_habito INT IDENTITY(1,1) PRIMARY KEY,
    fecha_registro_habito DATE DEFAULT GETDATE(),

    id_habito INT NOT NULL,
    CONSTRAINT FK_Registros_Habitos FOREIGN KEY (id_habito) REFERENCES Habitos(id_habito)
);

--------2.5 Tabla Materias--------
CREATE TABLE Materias (
    id_materia INT PRIMARY KEY IDENTITY(1,1),
    nombre_materia VARCHAR(100) NOT NULL,
    nota_necesaria_materia DECIMAL(4,2) NOT NULL,

    id_usuario INT NOT NULL,
    CONSTRAINT FK_Materias_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    CONSTRAINT UQ_Usuarios_Materias UNIQUE (id_usuario, nombre_materia)
);

--------2.6 Tabla Horarios de Materias--------
CREATE TABLE Horarios_Materias (
    id_horario INT PRIMARY KEY IDENTITY(1,1),
    dia_semana VARCHAR(50) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    id_materia INT NOT NULL,
    CONSTRAINT FK_Horarios_Materias FOREIGN KEY (id_materia) REFERENCES Materias(id_materia)
);

--------2.7 Tabla Tarjetas de Estudio--------
CREATE TABLE Tarjetas_Estudio (
    id_tarjeta_estudio INT IDENTITY(1,1) PRIMARY KEY,
    pregunta_tarjeta_estudio VARCHAR(500) NOT NULL,
    respuesta_tarjeta_estudio VARCHAR(MAX) NOT NULL,

    id_usuario INT NOT NULL,
    CONSTRAINT FK_Tarjetas_Usuarios FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);