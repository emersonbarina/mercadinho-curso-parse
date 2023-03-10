const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');

Parse.Cloud.define('get-list-product', async (req) => {
	const queryProducts = new Parse.Query(Product);
	// params
	const page = req.params.page || 0;
	const itemsPerPage = req.params.itemsPerPage || 20;
	if( itemsPerPage > 100) throw 'Quantidade de itens por página inválida';

	// Condições da query
	if(req.params.title != null) {
		//busca por palavra inteira
		queryProducts.fullText('title', req.params.title);

		//busca por parte da palavra - Mais lento
		//queryProducts.matches('title', '.*' + req.params.title + '.*');
	}

	if(req.params.categoryId != null){
		const category = new Category();
		category.id = req.params.categoryId;

		queryProducts.equalTo('category', category);
	}

	// -- Paginação
	queryProducts.skip(itemsPerPage * page);
	queryProducts.limit(itemsPerPage);

	// Includes
	queryProducts.include('category');

	// Executar
	const resultProducts = await queryProducts.find({useMasterKey: true});

	// Retornar
	return resultProducts.map(function (p) {
		p = p.toJSON();
		return formatProduct(p);
	});
});

Parse.Cloud.define('get-list-category', async (req) => {
	const queryCategories = new Parse.Query(Category);

	const resultCategories = await queryCategories.find({useMasterKey: true});
	return resultCategories.map( function (c) {
		c = c.toJSON();
		return {
			title: c.title,
			id: c.objectId
		}
	})
	
});

function formatProduct(productJson) {
	return {
		id: productJson.objectId,
		title: productJson.title,
		description: productJson.description,
		price: productJson.price,
		unit: productJson.unit,
		picture: productJson.picture != null ? productJson.picture.url : null,
		category: {
			title: productJson.category.title,
			id: productJson.category.objectId
		}
	};
}

module.exports = {formatProduct}