
const GEO = {
  "Arica y Parinacota":["Arica","Camarones","Putre","General Lagos"],
  "Tarapacá":["Iquique","Alto Hospicio","Pozo Almonte","Camiña","Colchane","Huara","Pica"],
  "Antofagasta":["Antofagasta","Mejillones","Sierra Gorda","Taltal","Calama","Ollagüe","San Pedro de Atacama","Tocopilla","María Elena"],
  "Atacama":["Copiapó","Caldera","Tierra Amarilla","Chañaral","Diego de Almagro","Vallenar","Alto del Carmen","Freirina","Huasco"],
  "Coquimbo":["La Serena","Coquimbo","Andacollo","La Higuera","Paihuano","Vicuña","Illapel","Canela","Los Vilos","Salamanca","Ovalle","Combarbalá","Monte Patria","Punitaqui","Río Hurtado"],
  "Valparaíso":["Valparaíso","Viña del Mar","Concón","Quilpué","Villa Alemana","Casablanca","San Antonio","Cartagena","El Quisco","El Tabo","Algarrobo","Santo Domingo","Quillota","La Calera","Limache","Olmué","Los Andes","San Felipe","La Ligua"],
  "Metropolitana de Santiago":["Santiago","Providencia","Las Condes","Ñuñoa","La Reina","Maipú","Puente Alto","La Florida","San Bernardo","Peñalolén","Quilicura","Pudahuel","Vitacura","Lo Barnechea","Colina","Lampa","Melipilla","Talagante"],
  "O'Higgins":["Rancagua","Machalí","Graneros","Mostazal","San Vicente","Rengo","Requínoa","Santa Cruz","San Fernando","Pichilemu"],
  "Maule":["Talca","Curicó","Linares","Cauquenes","Constitución","Molina","Parral","San Javier","Longaví"],
  "Ñuble":["Chillán","Chillán Viejo","Bulnes","Quillón","San Carlos","Coihueco","Yungay"],
  "Biobío":["Concepción","Talcahuano","Chiguayante","San Pedro de la Paz","Coronel","Lota","Hualpén","Los Ángeles","Cabrero","Yumbel","Mulchén","Nacimiento","Arauco","Cañete","Lebu"],
  "La Araucanía":["Temuco","Padre Las Casas","Villarrica","Pucón","Angol","Victoria","Lautaro","Nueva Imperial","Carahue","Collipulli"],
  "Los Ríos":["Valdivia","La Unión","Río Bueno","Panguipulli","Lanco","Mariquina","Paillaco"],
  "Los Lagos":["Puerto Montt","Puerto Varas","Osorno","Castro","Ancud","Quellón","Calbuco","Frutillar","Llanquihue","Purranque"],
  "Aysén":["Coyhaique","Aysén","Chile Chico","Cochrane"],
  "Magallanes y de la Antártica Chilena":["Punta Arenas","Puerto Natales","Porvenir","Cabo de Hornos"]
};

const CATEGORIES = {
  "Vehículos":"🚗","Propiedades":"🏠","Tecnología":"📱","Hogar":"🛋️","Servicios":"🔧","Empleos":"💼","Otros":"📦"
};

const DEMO_LISTINGS = [
  {id:101,category:"Vehículos",title:"Hyundai Tucson 2017 Diésel",price:13000000,region:"Biobío",commune:"Los Ángeles",description:"Automática, muy buen estado, mantenciones al día.",phone:"56911111111",plan:"top",photos:[]},
  {id:102,category:"Tecnología",title:"iPhone 15 128GB",price:590000,region:"Biobío",commune:"Concepción",description:"Excelente estado, incluye cargador.",phone:"56922222222",plan:"featured",photos:[]},
  {id:103,category:"Propiedades",title:"Casa en arriendo 3 dormitorios",price:520000,region:"Los Lagos",commune:"Puerto Montt",description:"Sector residencial, estacionamiento y patio.",phone:"56933333333",plan:"free",photos:[]},
  {id:104,category:"Servicios",title:"Servicio eléctrico domiciliario",price:35000,region:"Biobío",commune:"Los Ángeles",description:"Instalaciones, reparaciones y emergencias.",phone:"56944444444",plan:"free",photos:[]}
];
