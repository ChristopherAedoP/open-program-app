const { QdrantClient } = require('@qdrant/js-client-rest');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno manualmente
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
    console.log('Por favor asegúrate de que existe .env.local con las variables QDRANT_*');
    process.exit(1);
  }
}

loadEnv();

async function createQdrantIndexes() {
  console.log('🔧 Creando índices en Qdrant...');
  
  const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });

  const collection = process.env.QDRANT_COLLECTION;
  console.log(`📂 Colección: ${collection}`);

  try {
		// Crear índice para taxonomy_path
		console.log('📝 Creando índice para taxonomy_path...');
		await client.createPayloadIndex(collection, {
			field_name: 'taxonomy_path',
			field_schema: {
				type: 'keyword',
				is_tenant: false,
			},
		});
		console.log('✅ Índice taxonomy_path creado');

		// Crear índice para sub_category
		console.log('📝 Creando índice para sub_category...');
		await client.createPayloadIndex(collection, {
			field_name: 'sub_category',
			field_schema: {
				type: 'keyword',
				is_tenant: false,
			},
		});
		console.log('✅ Índice sub_category creado');

		// Crear índice para tags
		console.log('📝 Creando índice para tags...');
		await client.createPayloadIndex(collection, {
			field_name: 'tags',
			field_schema: {
				type: 'keyword',
				is_tenant: false,
			},
		});
		console.log('✅ Índice tags creado');

		// Crear índice para topic_category
		console.log('📝 Creando índice para topic_category...');
		await client.createPayloadIndex(collection, {
			field_name: 'topic_category',
			field_schema: {
				type: 'keyword',
				is_tenant: false,
			},
		});
		console.log('✅ Índice topic_category creado');

		// Crear índice para candidate
		console.log('📝 Creando índice para candidate...');
		await client.createPayloadIndex(collection, {
			field_name: 'candidate',
			field_schema: {
				type: 'keyword',
				is_tenant: false,
			},
		});
		console.log('✅ Índice candidate creado');

		// Verificar índices existentes
		console.log('🔍 Verificando índices existentes...');
		const collectionInfo = await client.getCollection(collection);
		console.log(
			'📊 Índices de payload:',
			JSON.stringify(collectionInfo.payload_schema, null, 2)
		);

		console.log('✅ ¡Todos los índices creados correctamente!');
	} catch (error) {
    if (error.status === 409) {
      console.log('ℹ️ Algunos índices ya existen, continuando...');
    } else {
      console.error('❌ Error creando índices:', error);
      throw error;
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createQdrantIndexes()
    .then(() => {
      console.log('🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { createQdrantIndexes };