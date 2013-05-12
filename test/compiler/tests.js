// Mocha tests
var assert = require("assert");
var parser = require("../../hsp/compiler/parser");
var compiler = require("../../hsp/compiler/compiler");
var ut = require("./utils/testutils");

describe('Block Parser: ', function(){

	it ('tests testutils.getContent', function(){
		var tpl=ut.getSampleContent("template").template;
		var s=[	'var x="text1";',
				'function func() {var x="text2"};',
				'',
				'# template hello1',
				'   Hello World!',
				'# /template',
				'',
				'// comment',
				'function func2(z) {return z;}',
				'',
				'# template hello1bis (arg1, arg2)',
				'\tHello',
				'\tAgain!',
				'# /template',
				'var z;'
				].join("\r\n");

		assert.equal(tpl,s,"sample content");
	});

	it ('tests testutils.compareJSCode', function(){
		var s1="";
		var s2="";
		assert.equal(ut.compareJSCode(s1,s2),"","compareJSCode 1");

		s1='new Ng([n.$text(0,["Hello World!"])]);';
		s2='new Ng  ( \n[ n.$text( 0,  \n["Hello World!"])]); ';
		assert.equal(ut.compareJSCode(s1,s2),"","compareJSCode 2");

	});
	

	var testFn= function(){
		var sample=ut.getSampleContent(this.name);
		var bl=parser.getBlockList(sample.template);
		if (sample.parsedTree) {
			assert.equal(ut.jsonContains(bl, sample.parsedTree, "parsedTree"), "", "parsed tree comparison");
		} else {
			console.log("--------------");
			console.log("Parsed tree for "+this.name+": ");
			console.log(JSON.stringify(bl ,null,"  "));
		}
		
		var r=compiler.compile(sample.template, this.name, true, true);
		if (sample.syntaxTree) {
			assert.equal(ut.jsonContains(r.syntaxTree, sample.syntaxTree, "syntaxTree"), "", "syntax tree comparison");
		} else {
			console.log("--------------");
			console.log("Syntax tree for "+this.name+": ");
			console.log(JSON.stringify(r.syntaxTree ,null,"  "));
		}

		if (sample.codeFragments) {
			if (r.errors.length>0) {
				console.log("--------------");
				for (var i=0, sz=r.errors.length;sz>i;i++) {
					console.log("Compilation error: "+r.errors[i].description);
				}
			}
			assert.equal(r.errors.length,0,"No compilation errors");
			
			for (var k in sample.codeFragments) {
				// validate generated code
				if (!r.codeFragments) assert.fail("Missing Generated code");
				else {
					assert.equal(ut.compareJSCode(r.codeFragments[k], sample.codeFragments[k]), "", k+" code fragment comparison");
				}
			}
		}
	}

	var samples=[	"template", "text1", "text2", "text3", "text4", "text5", "if1", "if2", "if3", "comment", 
					"foreach1", "foreach2", "foreach3", "element1", "element2", "evthandler", "insert"];
	for (var i=0, sz=samples.length;sz>i;i++) {
		// create one test for each sample
		it ('validates sample ('+samples[i]+')', testFn.bind({name:samples[i]}));
	}

	it ('validates full compiled template', function(){
		var sample=ut.getSampleContent("template");
		var r=compiler.compile(sample.template, "template");

		var s=[	
				compiler.HEADER,
				'',
				'var x="text1";',
				'function func() {var x="text2"};',
				'',
				'var hello1 = require("hsp/rt").template([], function(n){',
				'  return [n.$text(0,["Hello World!"])];',
				'});',
				'',
				'// comment',
				'function func2(z) {return z;}',
				'',
				'var hello1bis = require("hsp/rt").template(["arg1","arg2"], function(n){',
				'  return [n.$text(0,["Hello Again!"])];',
				'});',
				'var z;'
				].join("\r\n");

		assert.equal(r.errors.length,0,"no compilation error");
		//console.log(s.length) // 587
		//console.log(r.code.length) // 591		
		//assert.equal(r.code,s,"template generated code"); // strange issue with non visible characters
		assert.equal(ut.compareJSCode(r.code, s),"","template generated code");
	});
});
