const Product = Parse.Object.extend('Product');

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", (request) => {
	return "Hello world! Success!!!";
});

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
		return {
			id: p.objectId,
			title: p.title,
			description: p.description,
			price: p.price,
			unit: p.unit,
			picture: p.picture != null ? p.picture.url : null,
			category: {
				title: p.category.title,
				id: p.category.objectId
			}
		}
	});

});