# TechDrop 🛒

> 🛍️ Aplicación e-commerce full stack desarrollada como
> proyecto final de certificación en 4Geeks Academy España.

## 🚀 Demo en vivo
🔗 [Ver aplicación](https://cozy-frangipane-33a56e.netlify.app/)

## 📋 Descripción
TechDrop es una aplicación web full stack de e-commerce 
que permite a los usuarios explorar productos tecnológicos, 
gestionar su carrito de compras y realizar pedidos, con un 
panel de administración completo para la gestión del negocio.

## ✨ Funcionalidades

### Usuario
- Registro e inicio de sesión con autenticación JWT
- Exploración y búsqueda de productos
- Gestión de carrito de compras
- Historial de pedidos

### Administrador
- Panel de administración protegido por rol
- CRUD completo de productos
- Integración con API de Unsplash para imágenes
- Gestión de pedidos

## 🛠️ Tecnologías

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

### Backend
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

### Base de datos
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge)

### Deploy
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

## ⚙️ Instalación local

### Requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend
```bash
git clone https://github.com/4GeeksAcademy/Final-Project-Giorgio
cd Final-Project-Giorgio/src/api
pip install -r requirements.txt
# Configura las variables de entorno en .env
flask run
```

### Frontend
```bash
cd src/front
npm install
npm start
```

## 🔑 Variables de entorno

DATABASE_URL=postgresql://...
JWT_SECRET_KEY=tu_secret_key
UNSPLASH_ACCESS_KEY=tu_unsplash_key

## 👨‍💻 Autor
**Giorgio Abdalla Behna Occhipinti**
Full Stack Developer — 4Geeks Academy España

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/giorgioabo)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/giorgioabo)
