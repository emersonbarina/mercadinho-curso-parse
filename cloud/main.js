const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');

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

Parse.Cloud.define('signup', async (req) => {
	if(req.params.fullName == null) throw 'INVALID_FULLNAME';
	if(req.params.phone == null) throw 'INVALID_PHONE';
	if(req.params.cpf == null) throw 'INVALID_CPF';

	const user = new Parse.User();
	user.set("username", req.params.email);
	user.set("email", req.params.email);
	user.set("password", req.params.password);
	user.set("fullName", req.params.fullName);
	user.set("phone", req.params.phone);
	user.set("cpf", req.params.cpf);
  
	try {
		const resultUser = await user.signUp(null, {useMasterKey: true});
		const userJson = resultUser.toJSON();
		
		return {
			id: userJson.objectId,
			fullName: userJson.fullName,
			email: userJson.email,
			phone: userJson.phone,
			cpf: userJson.cpf,
			token: userJson.sessionToken,
		};
	} catch (e) {
		throw 'INVALID_DATA'
	}


	
});

Parse.Cloud.define('login', async (req) => {
	try {
		const user = await Parse.User.logIn(req.params.email, req.params.password);
		const userJson = resultUser.toJSON();
		
		return {
			id: userJson.objectId,
			fullName: userJson.fullName,
			email: userJson.email,
			phone: userJson.phone,
			cpf: userJson.cpf,
			token: userJson.sessionToken,
		};
	} catch(e) {
		throw 'INVALID_CREDENTIALS';
	}
});