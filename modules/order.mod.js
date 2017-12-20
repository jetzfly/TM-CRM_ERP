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

"use strict";

const moment = require('moment');

exports.name = 'order';
exports.version = 1.02;
exports.enabled = true;

exports.csv = {
		"model": "order",
		"schema": "Order",
		"aliases": {
				"ref": "Ref",
				"supplier.fullName": "Client",
				"ref_client": "Ref_Client",
				"salesPerson.fullName": "Commercial",
				"datedl": "Date exp",
				"Status": "Statut",
				"entity": "Entite",
				"total_ht": "Total HT",
				"total_ttc": "Total TTC",
				"status.allocateStatus": "Reserve",
				"status.fulfillStatus": "Rempli",
				"status.shippingStatus": "Expedie",
				"status.invoiceStatus": "Facture",

				"datec": "Date creation"
		},

		"arrayKeys": {},

		"formatters": {
				"Date exp": function(date) {
						return moment(date).format(CONFIG('dateformatLong'));
				},

				"Date creation": function(date) {
						return moment(date).format(CONFIG('dateformatLong'));
				},

				"Statut": function(Status) {
						const OrderStatus = MODEL('order').Status;

						let result = MODULE('utils').Status(Status, OrderStatus);
						return result.name;
				},
				"Reserve": function(value) {
						switch (value) {
								case 'NOT':
										return 'Aucun';
										break;
								case 'NOA':
										return 'Partiel';
										break;
								case 'ALL':
										return 'Complet';
										break;
								default:
										return "-";
						}
				},
				"Rempli": function(value) {
						switch (value) {
								case 'NOT':
										return 'Aucun';
										break;
								case 'NOA':
										return 'Partiel';
										break;
								case 'ALL':
										return 'Complet';
										break;
								default:
										return "-";
						}
				},
				"Expedie": function(value) {
						switch (value) {
								case 'NOT':
										return 'Aucun';
										break;
								case 'NOA':
										return 'Partiel';
										break;
								case 'ALL':
										return 'Complet';
										break;
								default:
										return "-";
						}
				},
				"Facture": function(value) {
						switch (value) {
								case 'NOT':
										return 'Aucun';
										break;
								case 'NOA':
										return 'Partiel';
										break;
								case 'ALL':
										return 'Complet';
										break;
								default:
										return "-";
						}
				}
		}
};

exports.description = 'Gestion des commandes clients';
exports.rights = [{
				"desc": "Lire les commandes clients",
				"perm": {
						"read": true
				}
		},
		{
				"desc": "Creer/modifier les commandes clients",
				"perm": {
						"create": false
				}
		},
		{
				"desc": "Valider les commandes clients",
				"perm": {
						"validate": false
				}
		},
		{
				"desc": "Re-ouvrir les commandes clients",
				"perm": {
						"reopen": false
				}
		},
		{
				"desc": "Envoyer les commandes clients",
				"perm": {
						"send": true
				}
		},
		{
				"desc": "Clôturer les commandes clients",
				"perm": {
						"closed": false
				}
		},
		{
				"desc": "Annuler les commandes clients",
				"perm": {
						"cancel": false
				}
		},
		{
				"desc": "Supprimer les commandes clients",
				"perm": {
						"delete": false
				}
		},
		{
				"desc": "Expedier les commandes clients",
				"perm": {
						"createDelivery": false
				}
		},
		{
				"desc": "Exporter les commandes clients et attributs",
				"perm": {
						"export": false
				}
		}
];
exports.menus = {
		"menu:orders": {
				"position": 30,
				"perms": "order.read",
				"enabled": "$conf->commande->enabled",
				"usertype": 2,
				"icon": "fa-shopping-cart",
				"title": "orders:Orders",
				route: "order",
				params: {
						forSales: 1
				},
				"submenus": {
						"menu:orderslist": {
								"position": 50,
								route: "order.list",
								params: {
										forSales: 1
								},
								"perms": "order.read",
								"enabled": "$conf->commande->enabled",
								"usertype": 2,
								"icon": "fa-shopping-cart",
								"title": "orders:ListOfOrders"
						}
				}
		}
};
exports.filters = {
		"order": {
				"forSales": {
						"backend": "forSales",
						"type": "boolean"
				},

				"ref": {
						"displayName": "Ref",
						"backend": "ref",
						"type": "regex"
				},

				"ref_client": {
						"displayName": "Ref customer",
						"backend": "ref_client",
						"type": "regex"
				},

				"entity": {
						"displayName": "Entity",
						"backend": "entity",
						"type": "string"
				},

				"Status": {
						"displayName": "Status",
						"backend": "Status",
						"type": "string"
				},

				"supplier": {
						"displayName": "Customer",
						"backend": "supplier"
				},

				"salesPerson": {
						"displayName": "Assigned To",
						"backend": "salesPerson"
				},

				"workflow": {
						"displayName": "Status",
						"backend": "workflow._id"
				},

				"allocationStatus": {
						"displayName": "Allocation Status",
						"backend": "status.allocateStatus",
						"type": "string"
				},

				"fulfilledStatus": {
						"displayName": "Fulfilled Status",
						"backend": "status.fulfillStatus",
						"type": "string"
				},

				"shippingStatus": {
						"displayName": "Shipping Status",
						"backend": "status.shippingStatus",
						"type": "string"
				},


				"invoiceStatus": {
						"displayName": "Invoice Status",
						"backend": "status.invoiceStatus",
						"type": "string"
				},

				"channel": {
						"displayName": "Channel",
						"backend": "channel._id"
				},

				"name": {
						"displayName": "Reference",
						"backend": "_id"
				},

				"datedl": {
						"type": "date",
						"backend": {
								"key": "datedl",
								"operator": ["$gte", "$lte"]
						}
				},

				"datec": {
						"type": "date",
						"backend": {
								"key": "datec",
								"operator": ["$gte", "$lte"]
						}
				},
				"total_ht": {
						"type": "number",
						"backend": {
								"key": "total_ht",
								"operator": ["$gte", "$lte"]
						}
				},

				"array": ["supplier", "salesPerson", "workflow", "allocationStatus", "fulfilledStatus", "shippingStatus", "channel", "name"]
		}
};

exports.pdfModels = [{
		code: 'ORDER',
		module: 'order',
		latex: 'order.tex', //latex main file in latex directory
		langs: [{
				description: "BdC (default)"
		}]
}];

F.on('load', function() {
		const ModulesModel = MODEL('modules').Schema;

		ModulesModel.insert(exports, function(err, doc) {
				if (err)
						return console.log("Error update module {0} : {1} ".format(exports.name, err));
		});
});
