
/*
 * Copyright 2014 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This module contains the log node
var klass = require("hsp/klass"),
    log = require("hsp/rt/log"),
    doc = require("hsp/document"),
    TNode = require("hsp/rt/tnode").TNode;

var LogNode = klass({
    $extends : TNode,

    /**
     * Log node generator ex: {log scope}
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 
     *      0 is passed if no expression is used
     * @param {Array} args array of the expression indexes to log in the log queue
     * @param {Integer} line the line number
     * @param {Integer} column the column number
     */
    $constructor : function (exps, args, file, dir, line, column) {
        TNode.$constructor.call(this, exps);
        this.file='';
        var r=file.match(/[^\/\\]+$/);
        if (r && r.length) {
            this.file=r[0];
        }
        this.dir=dir;
        this.line=line;
        this.column=column;
        this.args = args;
    },

    /**
     * Create the DOM node element and attach it to the parent
     */
    createNode : function () {
        this.node = doc.createComment("{log}");
        this.processLog();
    },

    /**
     * Process the information to be logged and push it to the log output (browser console by default)
     */
    processLog : function () {
        var itms=[], args=this.args, eh=this.eh, v;
        if (this.args) {
            for (var i=0, sz=args.length;sz>i;i++) {
                v=eh.getValue(args[i], this.vscope, undefined);
                itms.push(v);
            }
            itms.push({type:'debug',file:this.file,dir:this.dir,line:this.line,column:this.column});
            log.apply(null,itms);
        }
    },

    /**
     * Refresh the text node if its properties have changed
     */
    refresh : function () {
        if (this.adirty) {
            this.processLog();
        }
        TNode.refresh.call(this);
    },

    /**
     * Tell this node can be found in a component content 
     * Here only empty text nodes are considered as valid (and then ignored)
     */
    isValidCptAttElement:function () {
        return false; // TODO could be supported
    }
});


module.exports=LogNode;

