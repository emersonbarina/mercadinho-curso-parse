const Product = Parse.Object.extend('Product');

// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", (request) => {
	return "Hello world! Success!!!";
});

Parse.Cloud.define('get-list-product', async (req) => {
	const queryProducts = new Parse.Query(Product);

	// Condições da query

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
		}
	});

});