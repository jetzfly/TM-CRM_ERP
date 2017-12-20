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



exports.name = 'offer';
exports.version = 1.015;
exports.enabled = true;
exports.description = "Gestion des devis et demandes d'achats";
exports.rights = [{
				"desc": "Lire les propositons commerciales clients",
				"perm": {
						"read": true
				}
		},
		{
				"desc": "Creer/modifier les propositions commerciales clients",
				"perm": {
						"create": false
				}
		},
		{
				"desc": "Valider les propositions commerciales clients",
				"perm": {
						"validate": false
				}
		},
		{
				"desc": "Re-ouvrir les propositions commerciales clients",
				"perm": {
						"reopen": false
				}
		},
		{
				"desc": "Envoyer les propositions commerciales clients",
				"perm": {
						"send": true
				}
		},
		{
				"desc": "Cloturer les propositions commerciales clients",
				"perm": {
						"closed": false
				}
		},
		{
				"desc": "Supprimer les propositions commerciales clients",
				"perm": {
						"delete": false
				}
		},
		{
				"desc": "Exporter les propositions commerciales clients et attributs",
				"perm": {
						"export": false
				}
		}
];
exports.menus = {
		"menu:orders": {
				"submenus": {
						"menu:offerlist": {
								"position": 40,
								"perms": "offer.read",
								route: "offer.list",
								params: {
										forSales: 1
								},
								"enabled": "$conf->offer->enabled",
								"usertype": 2,
								"icon": "fa-calculator",
								"title": "orders:CommercialProposals"
						}
				}
		}
};

exports.pdfModels = [{
		code: 'OFFER',
		module: 'offer',
		forSales: true,
		latex: 'order.tex', //latex main file in latex directory
		langs: [{
				title: "Devis",
				description: "Devis (default)"
		}]
}, {
		code: 'OFFERF',
		module: 'offer',
		forSales: false,
		latex: 'order_supplier.tex', //latex main file in latex directory
		langs: [{
				title: "AO",
				description: "Demande de prix (default)"
		}]
}];

F.on('load', function() {
		const ModulesModel = MODEL('modules').Schema;
		ModulesModel.insert(exports, function(err, doc) {
				if (err)
						return console.log("Error update module {0} : {1} ".format(exports.name, err));
		});
});