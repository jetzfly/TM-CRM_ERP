/**
Copyright 2017 ToManage

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

@author    ToManage SAS <contact@tomanage.fr>
@copyright 2014-2017 ToManage SAS
@license   http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
International Registered Trademark & Property of ToManage SAS
*/



var fs = require('fs'),
		csv = require('csv'),
		_ = require('lodash'),
		moment = require('moment'),
		async = require('async');


var Dict = INCLUDE('dict');
var Latex = INCLUDE('latex');

exports.install = function() {

		var object = new Object();
		F.route('/erp/api/bill', object.getByViewType, ['authorize']);
		F.route('/erp/api/bill/export', object.exportToType, ['authorize']);
		F.route('/erp/api/bill/stats', object.stats, ['authorize']);
		//F.route('/erp/api/bill/pdf/', object.pdfAll, ['post', 'json', 'authorize', 60000]);
		F.route('/erp/api/bill/{id}', object.show, ['authorize']);
		F.route('/erp/api/bill', object.create, ['post', 'json', 'authorize'], 512);
		F.route('/erp/api/bill/{id}', object.clone, ['post', 'json', 'authorize'], 512);
		// Valid les Factures en bloc
		//F.route('/erp/api/bill/validate', object.validAll, ['post', 'json', 'authorize']);
		F.route('/erp/api/bill/accounting', object.exportAccounting, ['put', 'json', 'authorize']);
		F.route('/erp/api/bill/{id}', object.update, ['put', 'json', 'authorize'], 512);
		F.route('/erp/api/bill', object.updateFieldsManyId, ['patch', 'json', 'authorize'], 512);
		F.route('/erp/api/bill/{id}', object.destroy, ['delete', 'authorize']);
		F.route('/erp/api/bill/pdf/{invoiceId}', object.pdf, ['authorize']);
		F.route('/erp/api/bill/pdf/{invoiceId}', object.generatePdf, ['put', 'authorize', 5000]);
		F.route('/erp/api/bill/releveFacture/pdf/{societeId}', object.releve_facture, ['authorize']);
		F.route('/erp/api/bill/download/{:id}', object.download);
};

/*	// list for autocomplete
 app.post('/api/bill/autocomplete', function (req, res) {

 var BillModel = MODEL('invoice').Schema;

 console.dir(req.body.filter);
 if (req.body.filter == null)
 return res.send(200, {});
 var query = {
 "$or": [
 {name: new RegExp(req.body.filter.filters[0].value, "i")},
 {ref: new RegExp(req.body.filter.filters[0].value, "i")}
 ]
 };
 if (req.query.fournisseur) {
 query.fournisseur = req.query.fournisseur;
 } else // customer Only
 query.Status = {"$nin": ["ST_NO", "ST_NEVER"]};
 console.log(query);
 BillModel.find(query, {}, {limit: req.body.take}, function (err, docs) {
 if (err) {
 console.log("err : /api/bill/autocomplete");
 console.log(err);
 return;
 }

 var result = [];
 if (docs !== null)
 for (var i in docs) {
 //console.log(docs[i].ref);
 result[i] = {};
 result[i].name = docs[i].name;
 result[i].id = docs[i]._id;
 if (docs[i].cptBilling.id == null) {
 result[i].cptBilling = {};
 result[i].cptBilling.name = docs[i].name;
 result[i].cptBilling.id = docs[i]._id;
 } else
 result[i].cptBilling = docs[i].cptBilling;
 if (docs[i].price_level)
 result[i].price_level = docs[i].price_level;
 else
 result[i].price_level = "BASE";
 // add address
 result[i].address = {};
 result[i].address.name = docs[i].name;
 result[i].address.address = docs[i].address;
 result[i].address.zip = docs[i].zip;
 result[i].address.town = docs[i].town;
 result[i].address.country = docs[i].country;
 }

 return res.send(200, result);
 });
 });
 app.param('billId', object.bill);
 //other routes..
 };*/

function Object() {}

Object.prototype = {
		/*read: function() {
		    var BillModel = MODEL('invoice').Schema;
		    var self = this;

		    var query = {};
		    if (self.query) {
		        for (var i in self.query) {
		            switch (i) {
		                case "query":
		                    if (self.query.query == "WAIT") // For payment
		                        query.Status = {
		                        "$nin": ["PAID", "CANCELED", "DRAFT"]
		                    };
		                    break;
		                case "dater":
		                    query.dater = JSON.parse(self.query.dater);
		                    break;
		                case "journalId":
		                    query.journalId = JSON.parse(self.query.journalId);
		                    break;
		                default:
		                    query[i] = self.query[i];
		                    break;
		            }
		        }
		    }

		    // console.log(self.query);
		    //console.log(query);

		    BillModel.find(query, "-history -files -latex")
		        .populate("supplier", "name")
		        .populate({
		            path: "total_taxes.taxeId"
		        })
		        .sort({
		            ID: 1
		        })
		        .exec(function(err, doc) {
		            if (err) {
		                console.log(err);
		                self.json({
		                    notify: {
		                        type: "error",
		                        message: err
		                    }
		                });
		                return;
		            }

		            //console.log(doc);

		            self.json(doc);
		        });
		},*/
		getByViewType: function() {
				var self = this;
				var InvoiceModel = MODEL('invoice').Schema;
				var BillStatus = MODEL('invoice').Status;

				var data = self.query;
				var quickSearch = data.quickSearch;
				var paginationObject = MODULE('helper').page(self.query);
				var limit = paginationObject.limit;
				var skip = paginationObject.skip;

				InvoiceModel.query({
						query: data,
						limit: limit,
						skip: skip,
						user: self.user
				}, function(err, result) {
						var count;
						var firstElement;
						var response = {};

						if (err)
								return self.throw500(err);

						//console.log(result.length);
						result = MODULE('utils').Status(result, BillStatus);
						if (result.length)
								result[0].totalAll.Status = _.map(result[0].totalAll.Status, function(Status) {
										return _.extend(Status, MODULE('utils').Status(Status._id, OrderStatus));
								});

						firstElement = result[0];
						count = firstElement && firstElement.total ? firstElement.total : 0;
						response.total = count;
						response.totalAll = firstElement && firstElement.totalAll ? firstElement.totalAll : {
								count: 0,
								Status: [],
								total_ht: 0,
								total_ttc: 0,
								total_paid: 0,
								total_to_paid: 0
						};
						//response.total = result.length;
						response.data = result;
						//console.log(result);
						self.json(response);
				});

		},
		exportToType: function() {
				console.log("export invoice");

				var self = this;
				const Invoice = MODEL('invoice').Schema;

				var type = self.query.type;

				const exportMap = MODULE('bill').csv;

				var Stream = require('stream');
				var stream = new Stream();

				Invoice.query({
						query: self.query,
						user: self.user,
						exec: false
				}, function(err, resultQuery) {
						MODULE('exporter').exportToCsv({
								stream: stream,
								Model: Invoice,
								query: resultQuery,
								map: exportMap,
								fileName: type
						}, function(err, result) {
								if (err)
										console.log(err);

								stream.emit('end');
						});
				});

				self.res.setHeader('x-filename', 'export.csv');
				self.stream('application/text', stream, "export.csv");
		},
		show: function(id) {
				var InvoiceModel = MODEL('invoice').Schema;
				var self = this;
				InvoiceModel.getById(id, function(err, bill) {
						if (err)
								return self.throw500(err);

						self.json(bill);
				});
		},
		create: function() {
				var BillModel = MODEL('invoice').Schema;
				var self = this;

				if (self.query.forSales == "false")
						self.body.forSales = false;

				delete self.body.status;

				console.log(self.body);
				//return;

				var bill = {};
				bill = new BillModel(self.body);

				bill.createdBy = self.user._id;
				bill.editedBy = self.user._id;

				bill.save(function(err, doc) {
						if (err)
								return self.throw500(err);

						if (doc.orders.length)
								for (var i = 0; i < doc.orders.length; i++)
										F.emit('order:recalculateStatus', {
												userId: self.user._id.toString(),
												order: {
														_id: doc.orders[i].toString()
												}
										});

						self.json(doc);
				});
		},
		clone: function(id) {
				var self = this;
				var BillModel = MODEL('invoice').Schema;

				BillModel.getById(id, function(err, doc) {
						var bill = doc.toObject();

						delete bill._id;
						delete bill.__v;
						delete bill.ref;
						delete bill.createdAt;
						delete bill.updatedAt;
						delete bill.history;
						delete bill.pdfModel;
						bill.pdfs = [];
						bill.total_paid = 0;
						bill.Status = "DRAFT";
						bill.notes = [];
						bill.latex = {};
						bill.datec = new Date();
						bill.journalId = [];

						bill = new BillModel(bill);

						bill.createdBy = self.user._id;

						if (bill.entity == null)
								bill.entity = self.user.entity;

						//console.log(delivery);
						bill.save(function(err, doc) {
								if (err)
										return console.log(err);


								self.json(doc);
						});
				});
		},
		update: function(id) {
				const BillModel = MODEL('invoice').Schema;
				const self = this;

				if (!self.body.createdBy)
						self.body.createdBy = self.user._id;

				var rows = self.body.lines;
				let cpt = 1;

				delete self.body.Status;

				for (var i = 0; i < rows.length; i++) {
						rows[i].sequence = i;
						if (rows[i].type == 'product' && !rows[i].isDeleted)
								rows[i].numLine = cpt++;
				}

				self.body.dater = MODULE('utils').calculate_date_lim_reglement(self.body.datec, self.body.cond_reglement_code);

				rows = _.filter(rows, function(elem) {
						if (elem.type == 'kit')
								return false;

						if (elem.isDeleted)
								return false;

						return true;
				});

				MODULE('utils').sumTotal(rows, self.body.shipping, self.body.discount, self.body.supplier, function(err, result) {
						if (err) {
								console.log(err);
								return self.json({
										errorNotify: {
												title: 'Erreur',
												message: err
										}
								});
						}

						self.body.total_ht = result.total_ht;
						self.body.total_taxes = result.total_taxes;
						self.body.total_ttc = result.total_ttc;
						self.body.total_ttc += self.body.correction;
						self.body.weight = result.weight;

						self.body.lines = rows;

						if (self.body.total_ttc === 0)
								self.body.Status = 'DRAFT';

						self.body.ref = F.functions.refreshSeq(self.body.ref, self.body.datec);

						BillModel.findByIdAndUpdate(id, self.body, {
								new: true
						}, function(err, doc) {
								if (err) {
										console.log(err);
										return self.json({
												errorNotify: {
														title: 'Erreur',
														message: err
												}
										});
								}

								F.emit('invoice:recalculateStatus', {
										userId: self.user._id.toString(),
										invoice: {
												_id: doc._id.toString()
										}
								});

								if (doc.orders.length)
										for (var i = 0; i < doc.orders.length; i++)
												F.emit('order:recalculateStatus', {
														userId: self.user._id.toString(),
														order: {
																_id: doc.orders[i].toString()
														}
												});

								//console.log(doc);
								doc = doc.toObject();
								doc.successNotify = {
										title: "Success",
										message: "Facture enregistrée"
								};
								self.json(doc);
						});
				});
		},
		updateFieldsManyId: function() {
				const BillModel = MODEL('invoice').Schema;
				const self = this;

				var body = self.body.body;

				if (!self.body._id || !self.body._id.length)
						return self.throw500("No id");

				async.eachSeries(self.body._id, function(id, aCb) {

						async.waterfall([
								function(wCb) {
										BillModel.findById(id, wCb);
								},
								function(doc, wCb) {
										let cpt = 1;

										for (var i = 0; i < doc.lines.length; i++) {
												doc.lines[i].sequence = i;
												if (doc.lines[i].type == 'product' && !doc.lines[i].isDeleted)
														doc.lines[i].numLine = cpt++;
										}

										wCb(null, doc);
								},
								function(doc, wCb) {

										doc = _.extend(doc, body);

										if (doc.total_ttc === 0)
												doc.Status = 'DRAFT';
										else if (body.Status)
												doc.Status = body.Status;

										doc.updateAt = new Date();

										doc.ref = F.functions.refreshSeq(doc.ref, doc.datec);

										BillModel.setInvoiceNumber(doc, function(err, invoice) {
												BillModel.findByIdAndUpdate(id, invoice, {
														new: true
												}, wCb);
										});
								},
								function(doc, wCb) {
										if (doc.Status == 'DRAFT')
												return wCb();

										F.emit('invoice:recalculateStatus', {
												userId: self.user._id.toString(),
												invoice: {
														_id: doc._id.toString()
												}
										});

										F.emit('invoice:update', {
												userId: self.user._id.toString(),
												bill: {
														_id: doc._id.toString()
												},
												route: 'bill'
										}, BillModel);

										wCb();
								}
						], aCb);
				}, function(err) {
						if (err) {
								console.log(err);
								return self.json({
										errorNotify: {
												title: 'Erreur',
												message: err
										}
								});
						}

						var doc = {};
						doc.successNotify = {
								title: "Success",
								message: "Factures enregistrées"
						};
						self.json(doc);

				});
		},
		destroy: function(id) {
				var BillModel = MODEL('invoice').Schema;
				var self = this;

				BillModel.findByIdAndUpdate(id, {
						$set: {
								isremoved: true,
								Status: 'CANCELED',
								total_ht: 0,
								total_ttc: 0,
								total_tva: []
						}
				}, {
						new: true
				}, function(err, doc) {
						if (err)
								return self.throw500(err);

						F.emit('invoice:recalculateStatus', {
								userId: self.user._id.toString(),
								invoice: {
										_id: doc._id.toString()
								}
						});

						if (doc.orders.length)
								for (var i = 0; i < doc.orders.length; i++)
										F.emit('order:recalculateStatus', {
												userId: self.user._id.toString(),
												order: {
														_id: doc.orders[i].toString()
												}
										});


						self.json({});

				});
		},
		destroyList: function() {
				var BillModel = MODEL('invoice').Schema;
				var self = this;

				if (!this.query.id)
						return self.throw500("No ids in destroy list");

				//var list = JSON.parse(this.query.id);
				var list = this.query.id;
				if (!list)
						return self.throw500("No ids in destroy list");

				var ids = [];

				if (typeof list === 'object')
						ids = list;
				else
						ids.push(list);

				async.forEachLimit(ids, 100, function(id, aCb) {
						BillModel.findByIdAndUpdate(id, {
								$set: {
										isremoved: true,
										Status: 'CANCELED',
										total_ht: 0,
										total_ttc: 0,
										total_tva: []
								}
						}, {
								new: true
						}, function(err, doc) {
								if (err)
										return aCb(err);

								F.emit('invoice:recalculateStatus', {
										userId: self.user._id.toString(),
										invoice: {
												_id: doc._id.toString()
										}
								});

								if (doc.orders.length)
										for (var i = 0; i < doc.orders.length; i++)
												F.emit('order:recalculateStatus', {
														userId: self.user._id.toString(),
														order: {
																_id: doc.orders[i].toString()
														}
												});
								aCb();
						});
				}, function(err) {
						if (err)
								return self.throw500(err);

						self.json({});
				});
		},
		exportAccounting: function() {
				var BillModel = MODEL('invoice').Schema;
				var ProductModel = MODEL('product').Schema;
				var self = this;

				//console.log(self.query);

				var ids = self.body.id;
				if (!ids)
						return self.json({
								errorNotify: {
										title: 'Erreur',
										message: "No Id"
								}
						});
				if (typeof ids === 'string')
						ids = [ids];

				//console.log(ids);

				var billCustomer = function(bill, callback) {
						if (!bill.forSales)
								return callback(); // Not a customer invoice

						async.waterfall([
								function(cb) {

										// TODO Notify
										// TODO Add accounting
										var Book = INCLUDE('accounting').Book;
										var myBook = new Book();
										//myBook.setEntity(bill.entity);
										myBook.setName('VTE');

										// You can specify a Date object as the second argument in the book.entry() method if you want the transaction to be for a different date than today
										var entry = myBook.entry(bill.supplier.fullName, bill.datec, self.user._id) // libelle, date
												.setSeq(bill.ID); // numero de piece

										// Add amount to client account
										if (bill.total_ttc >= 0)
												entry.debit(bill.supplier.salesPurchases.customerAccount, bill.total_ttc, null, {
														supplier: bill.supplier._id,
														bills: [{
																invoice: bill._id,
																amount: bill.total_ttc
														}]
												});
										else
												entry.credit(bill.supplier.salesPurchases.customerAccount, Math.abs(bill.total_ttc), null, {
														supplier: bill.supplier._id,
														bills: [{
																invoice: bill._id,
																amount: bill.total_ttc
														}]
												});

										//Add transport
										if (bill.shipping.total_ht > 0)
												entry.credit('624200', bill.shipping.total_ht, null, {
														label: 'TRANS ' + bill.supplier.fullName,
														supplier: bill.supplier._id,
														bills: [{
																invoice: bill._id,
																amount: bill.shipping.total_ht
														}]
												});
										else if (bill.shipping.total_ht < 0)
												entry.credit('624200', Math.abs(bill.shipping.total_ht), null, {
														label: 'TRANS ' + bill.supplier.fullName,
														supplier: bill.supplier._id,
														bills: [{
																invoice: bill._id,
																amount: bill.shipping.total_ht
														}]
												});

										//Add global discount
										if (bill.discount.discount.value > 0)
												entry.debit('709000', bill.discount.discount.value, "REMISE", {
														label: 'DISC ' + bill.supplier.fullName,
														supplier: bill.supplier._id,
														bills: [{
																invoice: bill._id,
																amount: bill.discount.discount.value
														}]
												});
										else if (bill.discount.discount.value < 0)
												entry.credit('709000', Math.abs(bill.discount.discount.value), null, {
														label: 'DISC ' + bill.supplier.fullName,
														supplier: bill.supplier._id,
														bills: [{
																invoice: bill._id,
																amount: bill.discount.discount.value
														}]
												});

										//Add escompte
										if (bill.discount.escompte.value > 0)
												entry.debit('665000', bill.discount.escompte.value, "ESCOMPTE", {
														label: 'ESCO ' + bill.supplier.fullName,
														supplier: bill.supplier._id,
														bills: [{
																invoice: bill._id,
																amount: bill.discount.escompte.value
														}]
												});
										else if (bill.discount.discount.value < 0)
												entry.credit('665000', Math.abs(bill.discount.escompte.value), null, {
														label: 'ESCO ' + bill.supplier.fullName,
														supplier: bill.supplier._id,
														bills: [{
																invoice: bill._id,
																amount: bill.discount.escompte.value
														}]
												});


										cb(null, entry);
								},
								function(entry, cb) {
										const CountryModel = MODEL('countries').Schema;

										CountryModel.findById(bill.address.country, function(err, doc) {
												return cb(err, entry, doc);
										});
								},
								function(entry, country, cb) {

										// Add product lines
										// compact product lines

										var productLines = _.compact(_.map(bill.lines, function(line) {
												if (!line.product)
														return null;

												return {
														id: line.product._id.toString(),
														product: line.product,
														total_ht: line.total_ht
												}
										}));

										var out = {};
										for (var i = 0, len = productLines.length; i < len; i++) {
												if (out[productLines[i].id])
														out[productLines[i].id].total_ht += productLines[i].total_ht;
												else
														out[productLines[i].id] = {
																id: productLines[i].id,
																product: productLines[i].product,
																total_ht: productLines[i].total_ht
														};
										}

										var arr = _.values(out); // convert object to array
										//console.log(productLines, arr);

										async.each(arr, function(lineBill, callback) {
												//ProductModel.findOne({ _id: lineBill.id }, "ref compta_sell compta_sell_eu compta_sell_exp", function(err, product) {
												//console.log(lineBill);

												//if (!product)
												//    return callback("Error product " + lineBill.name + " does not exist !");

												// Affect good compta code if null EUROP or INTER
												if (!lineBill.product.sellFamily.accounts.length)
														return callback("Error family " + lineBill.product.sellFamily.langs[0].name + " no accounts !");

												var compta_sell;
												//if (lineBill.product.sellFamily.accounts.length)
												compta_sell = lineBill.product.sellFamily.accounts[0].account;

												//if (product.compta_sell)
												//    compta_sell = product.compta_sell;

												switch (country.fiscalZone) {
														case 'EUROP':
																compta_sell = lineBill.product.sellFamily.accounts[1].account;
																break;
														case 'INTER':
																compta_sell = lineBill.product.sellFamily.accounts[2].account;
																break;
														case 'DOM_TOM':
																compta_sell = lineBill.product.sellFamily.accounts[3].account;
																break;
														default:
																// FR default compta_sell
												}

												if (lineBill.total_ht > 0)
														entry.credit(compta_sell, lineBill.total_ht, null, {
																product: lineBill.product._id,
																supplier: bill.supplier._id,
																bills: [{
																		invoice: bill._id,
																		amount: lineBill.total_ht
																}]
														});
												else
														entry.debit(compta_sell, Math.abs(lineBill.total_ht), null, {
																product: lineBill.product._id,
																supplier: bill.supplier._id,
																bills: [{
																		invoice: bill._id,
																		amount: lineBill.total_ht
																}]
														});

												callback();
												//});
										}, function(err) {
												if (err)
														return cb(err);

												//lignes TVA
												for (var i = 0; i < bill.total_taxes.length; i++) {
														//console.log(bill.total_taxes[i]);

														//No tva
														if (bill.total_taxes[i].value == 0)
																continue;

														if (!bill.total_taxes[i].taxeId.sellAccount && !bill.total_taxes[i].taxeId.isOnPaid)
																return cb("Compta Taxe inconnu : " + bill.total_taxes[i].taxeId.code);

														var sellAccount = bill.total_taxes[i].taxeId.sellAccount;

														if (bill.total_taxes[i].taxeId.isOnPaid)
																sellAccount = "445740"; //Waiting account

														if (bill.total_taxes[i].value > 0)
																entry.credit(sellAccount, bill.total_taxes[i].value, bill.supplier.fullName, {
																		tax: bill.total_taxes[i].taxeId._id,
																		supplier: bill.supplier._id,
																		bills: [{
																				invoice: bill._id,
																				amount: bill.total_taxes[i].value
																		}]
																});
														else
																entry.debit(sellAccount, Math.abs(bill.total_taxes[i].value), bill.supplier.fullName, {
																		tax: bill.total_taxes[i].taxeId._id,
																		supplier: bill.supplier._id,
																		bills: [{
																				invoice: bill._id,
																				amount: bill.total_taxes[i].value
																		}]
																});

												}
												cb(err, entry);
										});
								},
								function(entry, cb) {
										//console.log(entry);

										entry.commit()
												.then(function(journal) {
														//console.log(journal);
														//self.json(journal);
														cb(null, journal);
												}, function(err) {

														cb(err);
												});
								}
						], callback);
				};

				var billSupplier = function(bill, callback) {
						if (bill.forSales)
								return callback(); // Not a supplier invoice

						async.waterfall([
										function(cb) {

												// TODO Notify
												// TODO Add accounting
												var Book = INCLUDE('accounting').Book;
												var myBook = new Book();
												//myBook.setEntity(bill.entity);
												myBook.setName('ACH');

												// You can specify a Date object as the second argument in the book.entry() method if you want the transaction to be for a different date than today
												var entry = myBook.entry(bill.supplier.fullName, bill.datec, self.user._id) // libelle, date
														.setSeq(bill.ID); // numero de piece

												// Add amount to client account
												if (bill.total_ttc >= 0)
														entry.credit(bill.supplier.salesPurchases.supplierAccount, bill.total_ttc, null, {
																supplier: bill.supplier._id,
																bills: [{
																		invoice: bill._id,
																		amount: bill.total_ttc
																}]
														});
												else
														entry.debit(bill.supplier.salesPurchases.supplierAccount, Math.abs(bill.total_ttc), null, {
																supplier: bill.supplier._id,
																bills: [{
																		invoice: bill._id,
																		amount: bill.total_ttc
																}]
														});

												cb(null, entry);
										},
										function(entry, cb) {
												const CountryModel = MODEL('countries').Schema;

												CountryModel.findById(bill.address.country, function(err, doc) {
														return cb(err, entry, doc);
												});
										},
										function(entry, country, cb) {

												// Add product lines
												// compact product lines

												var productLines = _.compact(_.map(bill.lines, function(line) {
														if (!line.product)
																return null;

														return {
																id: line.product._id.toString(),
																product: line.product,
																total_ht: line.total_ht
														}
												}));

												var out = {};
												for (var i = 0, len = productLines.length; i < len; i++) {
														if (out[productLines[i].id])
																out[productLines[i].id].total_ht += productLines[i].total_ht;
														else
																out[productLines[i].id] = {
																		id: productLines[i].id,
																		product: productLines[i].product,
																		total_ht: productLines[i].total_ht
																};
												}

												var arr = _.values(out); // convert object to array
												//console.log(productLines, arr);

												async.each(arr, function(lineBill, callback) {
														ProductModel.findOne({
																_id: lineBill.id
														}, "ref compta_buy compta_buy_eu compta_buy_exp", function(err, product) {

																if (!lineBill.product.costFamily)
																		return callback("Error no family cost on product {0} !".format(lineBill.product.info.SKU));

																if (!lineBill.product.costFamily.accounts.length && !product.compta_buy)
																		return callback("Error family " + lineBill.costFamily.langs[0].name + " no accounts !");


																var compta_buy;;
																if (lineBill.product.costFamily.accounts.length)
																		compta_buy = lineBill.product.costFamily.accounts[0].account;

																switch (country.fiscalZone) {
																		case 'EUROP':
																				compta_buy = lineBill.product.costFamily.accounts[1].account;
																				if (product.compta_buy_eu)
																						compta_buy = product.compta_buy_eu;
																				break;
																		case 'INTER':
																				compta_buy = lineBill.product.costFamily.accounts[2].account;
																				if (product.compta_buy_exp)
																						compta_buy = product.compta_buy_exp;
																				break;
																		case 'DOM_TOM':
																				compta_buy = lineBill.product.costFamily.accounts[3].account;
																				if (product.compta_buy_dom_tom)
																						compta_buy = product.compta_buy_dom_tom;
																				break;
																		default:
																				if (product.compta_buy)
																						compta_buy = product.compta_buy;
																				// FR default compta_buy
																}


																if (lineBill.total_ht > 0)
																		entry.debit(compta_buy, lineBill.total_ht, null, {
																				product: lineBill.product._id,
																				supplier: bill.supplier._id,
																				bills: [{
																						invoice: bill._id,
																						amount: lineBill.total_ht
																				}]
																		});
																else
																		entry.credit(compta_buy, Math.abs(lineBill.total_ht), null, {
																				product: lineBill.product._id,
																				supplier: bill.supplier._id,
																				bills: [{
																						invoice: bill._id,
																						amount: lineBill.total_ht
																				}]
																		});

																callback();
														});

												}, function(err) {
														if (err)
																return cb(err);

														//lignes TVA
														for (var i = 0; i < bill.total_taxes.length; i++) {
																//console.log(bill.total_taxes[i]);

																//No tva
																if (bill.total_taxes[i].value == 0)
																		continue;

																if (!bill.total_taxes[i].taxeId.buyAccount && !bill.total_taxes[i].taxeId.isOnPaid)
																		return cb("Compta Taxe inconnu : " + bill.total_taxes[i].taxeId.code);

																var buyAccount = bill.total_taxes[i].taxeId.buyAccount;

																if (bill.total_taxes[i].taxeId.isOnPaid)
																		buyAccount = "445640"; //Waiting account

																if (bill.total_taxes[i].value >= 0)
																		entry.debit(buyAccount, bill.total_taxes[i].value, bill.total_taxes[i].taxeId.code, {
																				tax: bill.total_taxes[i].taxeId._id,
																				supplier: bill.supplier._id,
																				bills: [{
																						invoice: bill._id,
																						amount: bill.total_taxes[i].value
																				}]
																		});
																else
																		entry.credit(buyAccount, Math.abs(bill.total_taxes[i].value), bill.total_taxes[i].taxeId.code, {
																				tax: bill.total_taxes[i].taxeId._id,
																				supplier: bill.supplier._id,
																				bills: [{
																						invoice: bill._id,
																						amount: bill.total_taxes[i].value
																				}]
																		});

														}
														cb(err, entry);
												});
										},
										function(entry, cb) {


												//Apply correction if needed
												if (bill.correction !== 0) {
														if (bill.correction >= 0)
																entry.debit("658000", bill.correction, "CORRECTION", {
																		label: "CORRECTION",
																		supplier: bill.supplier._id,
																		bills: [{
																				invoice: bill._id,
																				amount: bill.correction
																		}]
																});
														else
																entry.credit("658000", Math.abs(bill.correction), "CORRECTION", {
																		label: "CORRECTION",
																		supplier: bill.supplier._id,
																		bills: [{
																				invoice: bill._id,
																				amount: bill.correction
																		}]
																});
												}

												console.log(entry);

												entry.commit()
														.then(function(journal) {
																//console.log(journal);
																//self.json(journal);
																cb(null, journal);
														}, function(err) {
																cb(err);
														});
										}
								],
								callback);
				};

				async.each(ids, function(id, callback) {
								BillModel.findOne({
												_id: id,
												isremoved: {
														$ne: true
												}
										}, "-latex")
										.populate({
												path: "supplier",
												select: "name salesPurchases",
												populate: {
														path: "salesPurchases.priceList"
												}
										})
										.populate({
												path: "lines.product",
												select: "taxes info weight units sellFamily costFamily",
												populate: {
														path: "sellFamily costFamily"
												},
										})
										.populate({
												path: "lines.total_taxes.taxeId"
										})
										.populate({
												path: "total_taxes.taxeId"
										})
										.exec(function(err, bill) {
												//console.log(bill.total_taxes);
												//console.log(req.body);

												if (err)
														return callback(err);

												//already exported
												if (bill.Status !== 'NOT_PAID' || bill.journalId.length > 0)
														return callback(null);

												async.parallel([
														function(pCb) {
																billCustomer(bill, pCb);
														},
														function(pCb) {
																billSupplier(bill, pCb);
														}
												], function(err, journal) {
														if (err)
																return callback(err);

														if (journal[0])
																bill.journalId.push(journal[0]._id);
														if (journal[1])
																bill.journalId.push(journal[1]._id);

														bill.save(function(err, doc) {
																if (err)
																		return callback(err);
																//console.log(doc);
																callback(null);
														});
												});
										});
						},
						function(err) {
								if (err) {
										console.log(err);

										return self.json({
												errorNotify: {
														title: 'Erreur',
														message: err.message || err
												}
										});
								}

								return self.json({
										successNotify: {
												title: "Success",
												message: "Export compta enregistre"
										}
								});

						});
		},
		generatePdf: function(id) {
				// Generation de la facture PDF et download
				const InvoiceModel = MODEL('invoice').Schema;
				const self = this;

				InvoiceModel.generatePdfById(id, self.query.model, function(err, doc) {
						if (err)
								return self.json({
										errorNotify: {
												title: 'Erreur',
												message: err
										}
								});

						var doc = {};
						doc.successNotify = {
								title: "Success",
								message: "PDF Généré"
						};

						return self.json(doc);
				});
		},
		pdf: function(ref) {
				// Generation de la facture PDF et download
				const InvoiceModel = MODEL('invoice').Schema;

				const self = this;

				InvoiceModel.findOne({
						ref: ref
				}, function(err, doc) {

						//if (doc.status.isPrinted == null) {
						if (!doc.pdfs.length)
								return self.plain("File not found : click to generate");

						var log = {
								date: new Date(),
								author: self.user._id,
								mode: 'download',
								msg: 'PDF Telecharge par ' + self.user.username
						};

						InvoiceModel.findByIdAndUpdate(doc._id, {
								$addToSet: {
										history: log
								}
						}, function(err, doc) {});

						return self.stream('application/pdf', fs.createReadStream(F.path.root() + '/uploads/pdf/' + doc.pdfs[0].fileId));

				});
		},
		pdfAll: function() {
				var self = this;
				var entity = this.body.entity;

				// Generation de la facture PDF et download
				var BillModel = MODEL('invoice').Schema;

				var cond_reglement_code = {};
				Dict.dict({
						dictName: "fk_payment_term",
						object: true
				}, function(err, docs) {
						cond_reglement_code = docs;
				});
				var mode_reglement_code = {};
				Dict.dict({
						dictName: "fk_paiement",
						object: true
				}, function(err, docs) {
						mode_reglement_code = docs;
				});

				var tabTex = [];

				BillModel.find({
								Status: {
										$ne: "DRAFT"
								},
								isremoved: {
										$ne: true
								},
								_id: {
										$in: self.body.id
								}
						})
						//.populate("contacts", "name phone email")
						.populate({
								path: "supplier",
								select: "name salesPurchases",
								populate: {
										path: "salesPurchases.priceList"
								}
						})
						.populate({
								path: "lines.product",
								select: "taxes info weight units",
								//populate: { path: "taxes.taxeId" }
						})
						.populate({
								path: "lines.total_taxes.taxeId"
						})
						.populate({
								path: "total_taxes.taxeId"
						})
						//.populate("createdBy", "username")
						//.populate("editedBy", "username")
						//.populate("offer", "ref total_ht forSales")
						.populate("order", "ref total_ht forSales")
						.populate("orders", "ref total_ht forSales")
						//.populate('invoiceControl')
						//.populate('project', '_id name')
						.populate('shippingMethod', '_id name')
						//.populate('workflow', '_id name status')
						.exec(function(err, bills) {
								if (err)
										return console.log(err);

								if (!bills.length)
										return self.json({
												error: "No bills"
										});

								async.each(bills, function(bill, cb) {

										createBill(bill, false, function(err, tex) {
												if (err)
														return cb(err);
												//console.log(tex);

												tabTex.push({
														id: bill.ref,
														tex: tex
												});
												cb();
										});
								}, function(err) {
										if (err)
												return console.log(err);

										var texOutput = "";

										function compare(x, y) {
												var a = parseInt(x.id.substring(x.id.length - 6, x.id.length), 10);
												var b = parseInt(y.id.substring(y.id.length - 6, y.id.length), 10);

												if (a < b)
														return -1;
												if (a > b)
														return 1;
												return 0;
										}

										tabTex.sort(compare);

										for (var i = 0; i < tabTex.length; i++) {
												if (i !== 0) {
														texOutput += "\\newpage\n\n";
														texOutput += "\\setcounter{page}{1}\n\n";
												}

												texOutput += tabTex[i].tex;
										}

										//console.log(texOutput);

										self.res.setHeader('Content-type', 'application/pdf');
										self.res.setHeader('x-filename', 'factures.pdf');
										Latex.Template(null, entity)
												.on('error', function(err) {
														console.log(err);
														self.throw500(err);
												})
												.compile("main", texOutput)
												.pipe(self.res)
												.on('close', function() {
														console.log('document written');
												});
								});
						});
		},
		releve_facture: function(id) {
				// Generation de la facture PDF et download
				var BillModel = MODEL('invoice').Schema;
				var BankModel = MODEL('bank').Schema;
				var SocieteModel = MODEL('Customers').Schema;
				var self = this;

				var cond_reglement_code = {};
				Dict.dict({
						dictName: "fk_payment_term",
						object: true
				}, function(err, docs) {
						cond_reglement_code = docs;
				});
				var mode_reglement_code = {};
				Dict.dict({
						dictName: "fk_paiement",
						object: true
				}, function(err, docs) {
						mode_reglement_code = docs;
				});

				BillModel.find({
						"client.id": id,
						isremoved: {
								$ne: true
						},
						entity: self.query.entity,
						Status: {
								$in: ["VALIDATE", "NOT_PAID", "STARTED"]
						}
				}, function(err, bills) {

						var doc = bills[0];
						//console.log(bills);
						//return;

						if (bills == null || bills.length == 0) {
								return self.json({
										error: "Il n'y aucune facture en attente de règlement"
								});
						}

						SocieteModel.findOne({
								_id: doc.client.id
						}, function(err, societe) {
								BankModel.findOne({
										ref: societe.bank_reglement
								}, function(err, bank) {
										if (bank)
												var iban = bank.name_bank + "\n RIB : " + bank.code_bank + " " + bank.code_counter + " " + bank.account_number + " " + bank.rib + "\n IBAN : " + bank.iban + "\n BIC : " + bank.bic;


										var reglement = "";
										switch (doc.mode_reglement_code) {
												case "VIR":
														if (societe.bank_reglement) { // Bank specific for payment
																reglement = "\n" + iban;
														} else // Default IBAN
																reglement = "\n --IBAN--";
														break;
												case "CHQ":
														reglement = "A l'ordre de --ENTITY--";
														break;
										}

										var tabLines = [];
										tabLines.push({
												keys: [{
																key: "ref",
																type: "string"
														},
														{
																key: "datec",
																"type": "date",
																"format": CONFIG('dateformatShort')
														},
														{
																key: "ref_client",
																type: "string"
														},
														{
																key: "dater",
																"type": "date",
																"format": CONFIG('dateformatShort')
														},
														{
																key: "total_ht",
																type: "euro"
														},
														{
																key: "total_ttc",
																type: "euro"
														}
												]
										});

										var total_toPay = 0;

										for (var i = 0; i < bills.length; i++) {
												tabLines.push({
														ref: bills[i].ref,
														datec: bills[i].datec,
														ref_client: bills[i].ref_client,
														dater: bills[i].dater,
														total_ht: bills[i].total_ht,
														total_ttc: bills[i].total_ttc
												});
												total_toPay += bills[i].total_ttc;
										}

										self.res.setHeader('Content-type', 'application/pdf');
										Latex.Template("list_bills.tex", self.query.entity)
												.apply({
														"DESTINATAIRE.NAME": {
																"type": "string",
																"value": doc.shippingAddress.name
														},
														"DESTINATAIRE.ADDRESS": {
																"type": "area",
																"value": doc.shippingAddress.street
														},
														"DESTINATAIRE.ZIP": {
																"type": "string",
																"value": doc.shippingAddress.zip
														},
														"DESTINATAIRE.TOWN": {
																"type": "string",
																"value": doc.shippingAddress.city
														},
														"DESTINATAIRE.TVA": {
																"type": "string",
																"value": societe.companyInfo.idprof6
														},
														"CODECLIENT": {
																"type": "string",
																"value": societe.salesPurchases.code_client
														},
														"DATEC": {
																"type": "date",
																"value": new Date(),
																"format": CONFIG('dateformatShort')
														},
														"REGLEMENT": {
																"type": "string",
																"value": cond_reglement_code.values[doc.cond_reglement_code].label
														},
														"PAID": {
																"type": "string",
																"value": mode_reglement_code.values[doc.mode_reglement_code].label
														},
														"BK": {
																"type": "area",
																"value": reglement
														},
														"TABULAR": tabLines,
														"APAYER": {
																"type": "euro",
																"value": total_toPay || 0
														}
												})
												.on('error', function(err) {
														console.log(err);
														self.throw500(err);
												})
												.finalize(function(tex) {
														//console.log('The document was converted.');
												})
												.compile()
												.pipe(self.res)
												.on('close', function() {
														console.log('document written');
												});

										/*tex = tex.replace(/--APAYER--/g, latex.price(total_toPay));*/

								});
						});
				});
		},
		stats: function() {
				const BillModel = MODEL('invoice').Schema;
				var self = this;

				var dateStart = moment(self.query.start).startOf('day').toDate();
				var dateEnd = moment(self.query.end).endOf('day').toDate();
				var thisYear = moment(self.query.start).year();

				var dateStartN1 = moment(self.query.start).subtract(1, 'year').startOf('day').toDate();
				var dateEndN1 = moment(self.query.end).subtract(1, 'year').endOf('day').toDate();

				var ca = {};

				var query = {
						isremoved: {
								$ne: true
						},
						Status: {
								'$ne': 'CANCELED'
						},
						forSales: (self.query.forSales == 'false' ? false : true),
						$or: [{
										datec: {
												'$gte': dateStart,
												'$lt': dateEnd
										}
								},
								{
										datec: {
												'$gte': dateStartN1,
												'$lt': dateEndN1
										}
								}
						] // Date de facture
				};

				if (self.query.entity)
						query.entity = self.query.entity;

				/* supplier invoice */
				if (self.query.forSales && self.query.forSales == 'false')
						return BillModel.aggregate([{
												$match: query
										},
										{
												$project: {
														_id: 0,
														total_ht: 1,
														supplier: 1,
														year: {
																$year: '$datec'
														}
												}
										},
										{
												$group: {
														_id: {
																id: "$supplier",
																year: "$year"
														},
														total_ht: {
																"$sum": "$total_ht"
														}
												}
										},
										{
												$lookup: {
														from: 'Customers',
														localField: '_id.id',
														foreignField: '_id',
														as: 'supplier'
												}
										},
										{
												$unwind: "$supplier"
										},
										{
												$project: {
														_id: 1,
														total_ht: 1,
														'supplier.name': 1,
														'supplier._id': 1,
														'supplier.isSubcontractor': "$supplier.salesPurchases.isSubcontractor"
												}
										},
										{
												$group: {
														_id: {
																id: "$supplier.isSubcontractor",
																year: "$_id.year"
														},
														data: {
																$addToSet: {
																		supplier: "$supplier",
																		total_ht: "$total_ht"
																}
														},
														total_ht: {
																"$sum": "$total_ht"
														}
												}
										},
										{
												$sort: {
														'_id.year': -1,
														total_ht: -1
												}
										}
								],
								function(err, docs) {
										if (err)
												return console.log(err);

										if (!docs.length)
												return self.json({
														total: 0
												});

										//console.log(docs);
										let result = {
												charge: {
														total_ht: 0,
														total_ht_1: 0,
														data: []
												},
												subcontractor: {
														total_ht: 0,
														total_ht_1: 0,
														data: []
												}
										};

										//var res = [];
										var convertIdxCharge = {};
										var convertIdxSubContractor = {};

										async.forEachSeries(docs, function(elem, cb) {
												// supplier -> charge
												let doc = elem.data;
												if (elem._id.id == false) {

														if (elem._id.year == thisYear)
																result.charge.total_ht = elem.total_ht;
														else
																result.charge.total_ht_1 = elem.total_ht;

														for (var i = 0, len = doc.length; i < len; i++) {
																if (convertIdxCharge[doc[i].supplier._id.toString()] >= 0) {
																		if (elem._id.year == thisYear)
																				result.charge.data[convertIdxCharge[doc[i].supplier._id.toString()]].total_ht = doc[i].total_ht;
																		else
																				result.charge.data[convertIdxCharge[doc[i].supplier._id.toString()]].total_ht_1 = doc[i].total_ht;
																} else {
																		// add in array
																		if (elem._id.year == thisYear)
																				result.charge.data.push({
																						_id: doc[i].supplier._id.toString(),
																						total_ht: doc[i].total_ht,
																						total_ht_1: 0,
																						supplier: doc[i].supplier
																				});

																		else
																				result.charge.data.push({
																						_id: doc[i].supplier._id.toString(),
																						total_ht: 0,
																						total_ht_1: doc[i].total_ht,
																						supplier: doc[i].supplier
																				});

																		convertIdxCharge[doc[i].supplier._id.toString()] = result.charge.data.length - 1;
																}
														}

														return cb();
												}

												//subcontractor

												if (elem._id.year == thisYear)
														result.subcontractor.total_ht = elem.total_ht;
												else
														result.subcontractor.total_ht_1 = elem.total_ht;

												for (var i = 0, len = doc.length; i < len; i++) {
														if (convertIdxSubContractor[doc[i].supplier._id.toString()] >= 0) {
																if (elem._id.year == thisYear)
																		result.subcontractor.data[convertIdxSubContractor[doc[i].supplier._id.toString()]].total_ht = doc[i].total_ht;
																else
																		result.subcontractor.data[convertIdxSubContractor[doc[i].supplier._id.toString()]].total_ht_1 = doc[i].total_ht;
														} else {
																// add in array
																if (elem._id.year == thisYear)
																		result.subcontractor.data.push({
																				_id: doc[i].supplier._id.toString(),
																				total_ht: doc[i].total_ht,
																				total_ht_1: 0,
																				supplier: doc[i].supplier
																		});
																else
																		result.charge.data.push({
																				_id: doc[i].supplier._id.toString(),
																				total_ht: 0,
																				total_ht_1: doc[i].total_ht,
																				supplier: doc[i].supplier
																		});

																convertIdxSubContractor[doc[i].supplier._id.toString()] = result.subcontractor.data.length - 1;
														}
												}

												return cb();
										}, function(err) {
												self.json({
														total: (result.charge.total_ht + result.subcontractor.total_ht),
														data: result
												});
										});
								});

				var query = {
						isremoved: {
								$ne: true
						},
						Status: {
								'$ne': 'CANCELED'
						},
						forSales: (self.query.forSales == 'false' ? false : true),
						$or: [{
								datec: {
										'$gte': dateStart,
										'$lt': dateEnd
								}
						}] // Date de facture
				};
				//console.log(query);

				/* Customer invoice */
				BillModel.aggregate([{
										$match: query
								},
								{
										$project: {
												_id: 0,
												total_ht: 1
										}
								},
								{
										$group: {
												_id: null,
												total_ht: {
														"$sum": "$total_ht"
												}
										}
								}
						],
						function(err, doc) {
								if (err)
										return console.log(err);

								if (!doc.length)
										return self.json({
												total: 0
										});

								//console.log("totototot", doc);

								self.json({
										total: doc[0].total_ht
								});
						});
		},
		download: function(id) {
				var self = this;
				var BillModel = MODEL('invoice').Schema;

				var object = new Object();

				BillModel.findOne({
						_id: id,
						isremoved: {
								$ne: true
						}
				}, function(err, bill) {
						if (err)
								return self.throw500(err);

						if (!bill)
								return self.view404('Bill id not found');

						//var date = new Date();
						//order.updatedAt.setDate(order.updatedAt.getDate() + 15); // date + 15j, seulement telechargement pdt 15j

						//if (order.updatedAt < date)
						//    return self.view404('Order expired');

						object.pdf(id, self);

						bill.history.push({
								date: new Date(),
								mode: 'email',
								msg: 'email pdf telecharge',
								Status: 'notify'
						});

						bill.save();

				});
		}
};