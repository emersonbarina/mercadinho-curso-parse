const Product = Parse.Object.extend('Product');
const Category = Parse.Object.extend('Category');
const CartItem = Parse.Object.extend('CartItem');

function formatUser(userJson) {
	return {
		id: userJson.objectId,
		fullName: userJson.fullName,
		email: userJson.email,
		phone: userJson.phone,
		cpf: userJson.cpf,
		token: userJson.sessionToken,
	};
}

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
		return formatUser(userJson);
	} catch (e) {
		throw 'INVALID_DATA'
	}
});

Parse.Cloud.define('login', async (req) => {
	try {
		const resultUser = await Parse.User.logIn(req.params.email, req.params.password);
		const userJson = resultUser.toJSON();
		return formatUser(userJson);
	} catch(e) {
		throw 'INVALID_CREDENTIALS';
	}
});

Parse.Cloud.define('validate-token', async (req) => {
	try {
		return formatUser(req.user.toJSON());
	} catch(e) {
		throw 'INVALID_TOKEN';
	}
});

Parse.Cloud.define('change-password', async (req) => {
	// sem usuário logado
	if(req.user == null) throw 'INVALID_USER';

	// Verificar login do usuário é o mesmo do logado
	const user = await Parse.User.logIn(req.params.email, req.params.currentPassword);
	if(user.id != req.user.id) throw 'INVALID_USER';
	//alterar a senha
	user.set("password", req.params.newPassword);
	await user.save(null, {useMasterKey: true});
});

Parse.Cloud.define('reset-password', async (req) => {
	await Parse.User.requestPasswordReset(req.params.email);
});

Parse.Cloud.define('add-item-to-cart', async (req) => {
	if(req.params.quantity == null) throw 'INVALID_QUANTITY';
	if(req.params.productId == null) throw 'INVALID_PRODUCT';

	const cartItem = new CartItem();
	cartItem.set('quantity', req.params.quantity);
    
	// Product Pointer
	const product = new Product();
	product.id = req.params.productId;
	cartItem.set('product', product);
	// User Pointer
	cartItem.set('user', req.user);

	// Save
	const saveItem = await cartItem.save(null, {useMasterKey: true});

	// return id created
	return {
		id: saveItem.id,
	}

});

Parse.Cloud.define('modify-quantity-item', async (req) => {
	if(req.params.cartItemId == null) throw 'INVALID_CART_ITEM';
	if(req.params.quantity == null) throw 'INVALID_CART_QUANTITY';

	const cartItem = new CartItem();
	cartItem.id = req.params.cartItemId;
	if(req.params.quantity > 0) {
		cartItem.set('quantity', req.params.quantity);
		await cartItem.save(null, {useMasterKey: true});
	} else {
		await cartItem.destroy({useMasterKey: true});
	}
	
});

