
/*
 * Copyright 2012 Amadeus s.a.s.
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

// If condition node
var klass = require("../klass"),
    doc = require("./document"),
    tnode = require("./tnode"),
    TNode = tnode.TNode;

/**
 * If node Implements the if conditional statement. Adds a children2 collection that corresponds to the else block
 */
var $IfNode = klass({
    $extends : TNode,

    /**
     * IfNode generator
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {Integer} condexp the index of the condition expression - e.g. 1
     * @param {Array} children list of sub-node generators - 0 may be passed if there is not child nodes
     * @param {Array} children2 list of sub-node generators for the else statemetn - 0 may be passed if there is not
     * child nodes
     */
    $constructor : function (exps, condexp, children, children2) {
        TNode.$constructor.call(this, exps);
        this.isDOMless = true;
        // the if node has no container DOM elements - however its childNodes collection references
        // the nodes that it creates
        this.lastConditionValue = false;
        this.isDOMempty = true;
        this.condexpidx = condexp;
        if (children && children !== 0) {
            this.children = children;
        }
        if (children2 && children2 !== 0) {
            this.children2 = children2;
        }
    },

    /**
     * Create a node instance referencing the current node as base class As the $IfNode is DOMless it will not create a
     * DOM node for itself - but will create nodes for its children instead
     * @return {TNode} the new node instance
     */
    createNodeInstance : function (parent) {
        var ni = TNode.createNodeInstance.call(this, parent);
        var nd = ni.node; // same as parent node in this case
        ni.TYPE = "# if"; // for debugging purposes
        ni.node1 = doc.createComment("# if");
        ni.node2 = doc.createComment("# /if");
        nd.appendChild(ni.node1);
        nd.appendChild(ni.node2);
        ni.createChildNodeInstances(ni.getConditionValue());
        return ni;
    },

    /**
     * Delete and re-create the child node instances Must be called on a node instance
     * @param {boolean} condition the value of the condition to consider
     */
    createChildNodeInstances : function (condition) {
        this.lastConditionValue = condition;
        if (!this.refScope) {
            this.refScope=this.vscope; // reference scope - may be different from parent for component content
        }

        if (!this.isDOMempty) {
            this.removeChildNodeInstances(this.node1,this.node2);
            this.isDOMempty = true;
        }

        // create new scope
        this.vscope = this.createSubScope(this.refScope);

        // evalutate condition expression to determine which children collection to use (i.e. if or block)

        var ch = condition ? this.children : this.children2;
        // create child nodes
        if (ch) {
            // the if node has no container DOM elements - however its childNodes collection references
            // the nodes that it creates
            var sz = ch.length, n;
            if (sz > 0) {
                this.childNodes = [];
                var df = doc.createDocumentFragment();
                this.node = df; // use a doc fragment to create the new node instead of the parent node
                for (var i = 0; sz > i; i++) {
                    n = ch[i].createNodeInstance(this);
                    this.childNodes.push(n);
                }
                this.replaceNodeBy(this.node, this.parent.node); // recursively remove doc fragment reference
                this.node.insertBefore(df, this.node2);
                this.isDOMempty = false;
            }
        }

    },

    /**
     * Processes the current condition value
     */
    getConditionValue : function () {
        var condition = false;
        if (this.eh)
            condition = this.eh.getValue(this.condexpidx, this.vscope, false);
        return condition ? true : false; // cast to a boolean to be able to compare new and old condition values
    },

    /**
     * Refresh the node If the if condition has changed, delete previous child nodes and create those corresponding to
     * the else statement. Otherwise performs the regular recursive refresh
     */
    refresh : function () {
        var cond = this.getConditionValue(), ch;
        if (cond !== this.lastConditionValue) {
            this.createChildNodeInstances(cond);
            this.root.updateObjectObservers(this);

            this.cdirty = false;

            // check if one child is dirty
            if (this.childNodes) {
                for (var i=0;this.childNodes.length>i;i++) {
                    ch=this.childNodes[i];
                    if (ch.adirty || ch.cdirty) {
                        this.cdirty=true;
                        break;
                    }
                }
            }
        }
        TNode.refresh.call(this);
    },

    /**
     * Return the component attribute type of the current node
     * @return {String} one of the following option:
     *      "ATTELT" if the element is an attribute element (e.g. <@body>)
     *      "CONTENT" if the node is a content element (e.g. <div>)
     *      "INDEFINITE" if the element can be part of eithe an attribute or content collection (e.g. blank text nodes)
     *      "ERROR" if elt mixes attribute and content elements
     */
    getCptAttType: function() {
        // this method must be overridden by child classes
        var t1=this.getCptContentType(this.children), t2=this.getCptContentType(this.children2);
        if (t1==="ERROR" || t2==="ERROR") {
            return "ERROR";
        }
        if (t1==="ATTELT") {
            if (t2==="CONTENT") {
                return "ERROR";
            } else {
                // t2 is either ATTELT or INDEFINITE
                return "ATTELT";
            }
        } else if (t1==="CONTENT") {
            if (t2==="ATTELT") {
                return "ERROR";
            } else {
                // t2 is either CONTENT or INDEFINITE
                return "CONTENT";
            }
        } else if (t1==="INDEFINITE") {
            return t2;
        }
    },

    /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component attribute element: @body]"
    */
    toString:function() {
        return "[If]"; // todo add condition description or parent component name
    }
});

module.exports = $IfNode;