**CFGS 2DAW**

**Programación en Entorno Cliente**

**IA Claude MCP + Express + Node.js + Angular 21 + Supabase + Cloudinary**

**Creación de una tienda online de venda de zapatillas**

# **Tienda online de zapatillas**

La siguiente práctica requiere diseñar y programar una página web destinada a vender zapatillas, la cual dispondrá de un panel de administración para gestionar productos y pedidos, y uno de usuarios para poder realizar compras, gestionar el carrito y ver sus pedidos realizados.

## **Arquitectura del Proyecto**


## **Pasos para Realizar la Práctica**

### **Configuración de Claude + Supabase + Cloudinary**

**Supabase**

Creamos una cuenta de Supabase, utilizamos una que ya tengamos o creamos una a través de nuestra cuenta de Github. A continuación, creamos un nuevo proyecto con su nombre.


Una vez creado, desde el dashboard del proyecto, obtenemos los siguientes valores:

Desde Project Settings🡪General:

- Obtenemos el Project ID y el Project Name

Desde Project Settings🡪API Keys:

- Obtenemos el Publishable Keys y el Secret Keys (O Role Key)

Ahora, desde la configuración de nuestra cuenta, vamos a Access Token, generamos uno nuevo y guardamos el token resultante como Access Token.


**Cloudinary**

Creamos cuenta en Cloudinary. <https://cloudinary.com/>

Una vez creada, obtenemos los siguientes datos:

Desde Settings🡪API Keys, obtenemos:

- API KEY
- API SECRET

Desde Home🡪Dashboard, obtenemos

- Cloud Name

**Claude**

Instalamos Claude Desktop en nuestro equipo <https://claude.com/download>

Ahora configuraremos toda la parte del MCP de Claude para que apunte a nuestro proyecto en Supabase. Para ello, vamos a la siguiente ruta desde Windows. Si el archivo no existe, lo crearemos manualmente en esa carpeta con este nombre:

C:\\Users\\TU_USUARIO\\AppData\\Roaming\\Claude\\claude_desktop_config.json

Dentro del fichero, pegamos el siguiente json con la información necesaria para gestionar nuestro proyecto:

{

"mcpServers": {

"supabase": {

"command": "npx",

"args": \[

"-y",

"@supabase/mcp-server-supabase@latest",

"--project-ref=TU_PROJECT_REF"

\],

"env": {

"SUPABASE_ACCESS_TOKEN": "TU_TOKEN_AQUI"

}

}

}

}

Ahora tenemos que cerrar la aplicación de escritorio de Claude y volverla a abrir. Una vez hecho, le indicaremos a Claude el siguiente Prompt: "por favor, lista todos los proyectos MCP con Supabase."

Debería poder conectar correctamente con nuestro proyecto e indicarnos que puede acceder correctamente. Si no lo hace, es posible que haya algún problema con el fichero json.

### **Configuración del BackEnd: Next + Express**

Toda la configuración del backend está subida en el siguiente repositorio de Github. <https://github.com/Javizawa/sneakers-ecommerce-backend>

Para configurarlo correctamente, se han creado los siguientes documentos en el proyecto:

- **Readme.md:** Información para desplegar la API y sus dependencias en nuestro entorno de desarrollo.
- **Database.md:** Información para configurar mediante MCP de la base de datos en Supabase.

La base de datos tendrá la siguiente estructura jerárquica:


A su vez, el modelo relacional debería tener un estilo como este:


**HOME PRINCIPAL**

La página principal tiene que ser igual, tanto para usuarios como para administradores. En ella, tendremos una parte promocional de la web, una zona de productos destacados y una zona de acceso a calzado por categorías.

En el navbar sí hay distinción entre roles:

- Si el usuario no está autentificado, el navbar muestra las secciones de Inicio y Catálogo, y el botón de Iniciar Sesión.
- Si el usuario está autentificado como Administrador, el navbar muestra las secciones de Inicio, Catálogo, Admin de Productos y Admin de Pedidos (No añadir Mis pedidos, aunque aparezca en las capturas), el nombre del usuario y el botón de salir de sesión.
- Si el usuario está autentificado como Usuario, el navbar muestra las secciones de Inicio, Catálogo y Mis Pedidos, el carrito con el contador de productos dentro, el nombre del usuario y el botón de salir de sesión.


**CATALOGO**

En la pantalla de catálogo, que es común para todos los usuarios, se muestran los productos con sus datos más importantes y su imagen. Hay un buscador de texto y un buscador mediante categorías. Al hacer clic en cualquier producto, se muestra una página con el producto, todas sus propiedades y las posibilidades de número de calzado para comprar (Ver apartado Comprar desde Producto de esta práctica).


**LOGIN**

El login pide el usuario y la contraseña de los usuarios registrados, que estarán almacenados en Supabase. Si se quiere hacer un registro desde cero, se hace clic en el botón Regístrate.


**REGISTER**

Al registrarte como usuario, te pide nombre, email, contraseña y confirmar contraseña. El usuario que crea tiene el rol por defecto de Usuario. Si se quiere cambiar a Administrador se tiene que hacer por Supabase.


**HEADER ADMINISTRADOR**

Se muestran las opciones descriptas anteriormente para administradores. Recuerda no añadir Mis Pedidos.


**GESTIÓN DE PRODUCTOS**

Únicamente el Administrador puede acceder a esta sección. En ella, se pueden crear nuevos productos, modificar cualquiera de sus campos y su imagen, y borrarlos de forma lógica de base de datos.


**AÑADIR PRODUCTO**

Se añade el nombre del producto, la imagen, la marca, su categoría, el precio, el stock, las tallas de zapatillas, su stock separadas por comas y una descripción.


**MODIFICAR PRODUCTO**

Se puede cambiar cualquier dato o la imagen del producto al hacer clic en el botón editar.


**ELIMINAR PRODUCTO**

Al hacer clic en Eliminar, aparecerá un mensaje de alerta que indica que el producto se va a borrar de forma permanente. De forma interna, en Supabase, se realizará un borrado lógico, no físico.

**GESTIÓN DE PEDIDOS**

Únicamente disponible para administradores. En esta pantalla aparecen todos los pedidos hechos por usuarios y el administrador le puede cambiar el estado. Ese estado se verá reflejado al usuario cuando mire en la sección de mis Pedidos.


**HEADER USUARIO**

Se muestran las opciones descriptas anteriormente para usuarios.


**COMPRAR DESDE PRODUCTO**

Al hacer clic sobre un producto, el usuario puede comprarlo seleccionando la talla y la cantidad. Al hacer clic en el botón Añadir al carrito, el icono del carrito tiene que mostrar un contador con los pedidos que tiene incluidos.


**CARRITO VACÍO**

Al hacer clic sobre el botón del carrito, si no hay ningún producto en él, muestra la siguiente ventana.


**PRODUCTOS AÑADIDOS AL CARRITO**

En cambio, si hay productos en él, mostrará el producto, una breve descripción, su imagen, la cantidad y el precio calculado. Al hacer clic sobre el botón Finalizar Pedido, se mostrarán dos campos nuevos para informar sobre la dirección y alguna observación que queramos hacer de la entrega del pedido.


**MIS PEDIDOS**

Al hacer clic en Mis Pedidos, si el usuario no ha realizado nunca ninguno, aparecerá la siguiente ventana.


En cambio, si ha realizado pedidos, se mostrarán todos los que haya realizado, el estado en el que se encuentran y se podrá hacer clic para mostrar los productos que lo componen.

