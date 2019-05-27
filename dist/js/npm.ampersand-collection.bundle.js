(window.webpackJsonp=window.webpackJsonp||[]).push([["npm.ampersand-collection"],{"7bd3":function(module,exports,__webpack_require__){eval("var AmpersandEvents = __webpack_require__(/*! ampersand-events */ \"13c2\");\nvar classExtend = __webpack_require__(/*! ampersand-class-extend */ \"21d2\");\nvar isArray = __webpack_require__(/*! lodash/isArray */ \"f2ef\");\nvar bind = __webpack_require__(/*! lodash/bind */ \"742b\");\nvar assign = __webpack_require__(/*! lodash/assign */ \"5ad5\");\nvar slice = [].slice;\n\nfunction Collection(models, options) {\n    options || (options = {});\n    if (options.model) this.model = options.model;\n    if (options.comparator) this.comparator = options.comparator;\n    if (options.parent) this.parent = options.parent;\n    if (!this.mainIndex) {\n        var idAttribute = this.model && this.model.prototype && this.model.prototype.idAttribute;\n        this.mainIndex = idAttribute || 'id';\n    }\n    this._reset();\n    this.initialize.apply(this, arguments);\n    if (models) this.reset(models, assign({silent: true}, options));\n}\n\nassign(Collection.prototype, AmpersandEvents, {\n    initialize: function () {},\n\n    isModel: function (model) {\n        return this.model && model instanceof this.model;\n    },\n\n    add: function (models, options) {\n        return this.set(models, assign({merge: false, add: true, remove: false}, options));\n    },\n\n    // overridable parse method\n    parse: function (res, options) {\n        return res;\n    },\n\n    // overridable serialize method\n    serialize: function () {\n        return this.map(function (model) {\n            if (model.serialize) {\n                return model.serialize();\n            } else {\n                var out = {};\n                assign(out, model);\n                delete out.collection;\n                return out;\n            }\n        });\n    },\n\n    toJSON: function () {\n        return this.serialize();\n    },\n\n    set: function (models, options) {\n        options = assign({add: true, remove: true, merge: true}, options);\n        if (options.parse) models = this.parse(models, options);\n        var singular = !isArray(models);\n        models = singular ? (models ? [models] : []) : models.slice();\n        var id, model, attrs, existing, sort, i, length;\n        var at = options.at;\n        var sortable = this.comparator && (at == null) && options.sort !== false;\n        var sortAttr = ('string' === typeof this.comparator) ? this.comparator : null;\n        var toAdd = [], toRemove = [], modelMap = {};\n        var add = options.add, merge = options.merge, remove = options.remove;\n        var order = !sortable && add && remove ? [] : false;\n        var targetProto = this.model && this.model.prototype || Object.prototype;\n\n        // Turn bare objects into model references, and prevent invalid models\n        // from being added.\n        for (i = 0, length = models.length; i < length; i++) {\n            attrs = models[i] || {};\n            if (this.isModel(attrs)) {\n                id = model = attrs;\n            } else if (targetProto.generateId) {\n                id = targetProto.generateId(attrs);\n            } else {\n                id = attrs[this.mainIndex];\n                if (id === undefined && this._isDerivedIndex(targetProto)) {\n                    id = targetProto._derived[this.mainIndex].fn.call(attrs);\n                }\n            }\n\n            // If a duplicate is found, prevent it from being added and\n            // optionally merge it into the existing model.\n            if (existing = this.get(id)) {\n                if (remove) modelMap[existing.cid || existing[this.mainIndex]] = true;\n                if (merge) {\n                    attrs = attrs === model ? model.attributes : attrs;\n                    if (options.parse) attrs = existing.parse(attrs, options);\n                    // if this is model\n                    if (existing.set) {\n                        existing.set(attrs, options);\n                        if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;\n                    } else {\n                        // if not just update the properties\n                        assign(existing, attrs);\n                    }\n                }\n                models[i] = existing;\n\n            // If this is a new, valid model, push it to the `toAdd` list.\n            } else if (add) {\n                model = models[i] = this._prepareModel(attrs, options);\n                if (!model) continue;\n                toAdd.push(model);\n                this._addReference(model, options);\n            }\n\n            // Do not add multiple models with the same `id`.\n            model = existing || model;\n            if (!model) continue;\n            if (order && ((model.isNew && model.isNew() || !model[this.mainIndex]) || !modelMap[model.cid || model[this.mainIndex]])) order.push(model);\n            modelMap[model[this.mainIndex]] = true;\n        }\n\n        // Remove nonexistent models if appropriate.\n        if (remove) {\n            for (i = 0, length = this.length; i < length; i++) {\n                model = this.models[i];\n                if (!modelMap[model.cid || model[this.mainIndex]]) toRemove.push(model);\n            }\n            if (toRemove.length) this.remove(toRemove, options);\n\n            // Add indexes again to make sure they were not removed above.\n            for (i = 0, length = toAdd.length; i < length; i++) {\n                this._index(toAdd[i]);\n            }\n        }\n\n        // See if sorting is needed, update `length` and splice in new models.\n        if (toAdd.length || (order && order.length)) {\n            if (sortable) sort = true;\n            if (at != null) {\n                for (i = 0, length = toAdd.length; i < length; i++) {\n                    this.models.splice(at + i, 0, toAdd[i]);\n                }\n            } else {\n                var orderedModels = order || toAdd;\n                for (i = 0, length = orderedModels.length; i < length; i++) {\n                    this.models.push(orderedModels[i]);\n                }\n            }\n        }\n\n        // Silently sort the collection if appropriate.\n        if (sort) this.sort({silent: true});\n\n        // Unless silenced, it's time to fire all appropriate add/sort events.\n        if (!options.silent) {\n            for (i = 0, length = toAdd.length; i < length; i++) {\n                model = toAdd[i];\n                if (model.trigger) {\n                    model.trigger('add', model, this, options);\n                } else {\n                    this.trigger('add', model, this, options);\n                }\n            }\n            if (sort || (order && order.length)) this.trigger('sort', this, options);\n        }\n\n        // Return the added (or merged) model (or models).\n        return singular ? models[0] : models;\n    },\n\n    get: function (query, indexName) {\n        if (query == null) return;\n\n        var collectionMainIndex = this.mainIndex;\n        var index = this._indexes[indexName || collectionMainIndex];\n\n        return (\n            (\n                index && (\n                    index[query] || (\n                        query[collectionMainIndex] !== undefined &&\n                        index[query[collectionMainIndex]]\n                    )\n                )\n            ) ||\n            this._indexes.cid[query] ||\n            this._indexes.cid[query.cid]\n        );\n    },\n\n    // Get the model at the given index.\n    at: function (index) {\n        return this.models[index];\n    },\n\n    remove: function (models, options) {\n        var singular = !isArray(models);\n        var i, length, model, index;\n\n        models = singular ? [models] : slice.call(models);\n        options || (options = {});\n        for (i = 0, length = models.length; i < length; i++) {\n            model = models[i] = this.get(models[i]);\n            if (!model) continue;\n            this._deIndex(model);\n            index = this.models.indexOf(model);\n            this.models.splice(index, 1);\n            if (!options.silent) {\n                options.index = index;\n                if (model.trigger) {\n                    model.trigger('remove', model, this, options);\n                } else {\n                    this.trigger('remove', model, this, options);\n                }\n            }\n            this._removeReference(model, options);\n        }\n        return singular ? models[0] : models;\n    },\n\n    // When you have more items than you want to add or remove individually,\n    // you can reset the entire set with a new list of models, without firing\n    // any granular `add` or `remove` events. Fires `reset` when finished.\n    // Useful for bulk operations and optimizations.\n    reset: function (models, options) {\n        options || (options = {});\n        for (var i = 0, length = this.models.length; i < length; i++) {\n            this._removeReference(this.models[i], options);\n        }\n        options.previousModels = this.models;\n        this._reset();\n        models = this.add(models, assign({silent: true}, options));\n        if (!options.silent) this.trigger('reset', this, options);\n        return models;\n    },\n\n    sort: function (options) {\n        var self = this;\n        if (!this.comparator) throw new Error('Cannot sort a set without a comparator');\n        options || (options = {});\n\n        if (typeof this.comparator === 'string') {\n            this.models.sort(function (left, right) {\n                if (left.get) {\n                    left = left.get(self.comparator);\n                    right = right.get(self.comparator);\n                } else {\n                    left = left[self.comparator];\n                    right = right[self.comparator];\n                }\n                if (left > right || left === void 0) return 1;\n                if (left < right || right === void 0) return -1;\n                return 0;\n            });\n        } else if (this.comparator.length === 1) {\n            this.models.sort(function (left, right) {\n                left = self.comparator(left);\n                right = self.comparator(right);\n                if (left > right || left === void 0) return 1;\n                if (left < right || right === void 0) return -1;\n                return 0;\n            });\n        } else {\n            this.models.sort(bind(this.comparator,this));\n        }\n\n        if (!options.silent) this.trigger('sort', this, options);\n        return this;\n    },\n\n    // Private method to reset all internal state. Called when the collection\n    // is first initialized or reset.\n    _reset: function () {\n        var list = slice.call(this.indexes || []);\n        var i = 0;\n        list.push(this.mainIndex);\n        list.push('cid');\n        var l = list.length;\n        this.models = [];\n        this._indexes = {};\n        for (; i < l; i++) {\n            this._indexes[list[i]] = {};\n        }\n    },\n\n    _prepareModel: function (attrs, options) {\n        // if we haven't defined a constructor, skip this\n        if (!this.model) return attrs;\n\n        if (this.isModel(attrs)) {\n            if (!attrs.collection) attrs.collection = this;\n            return attrs;\n        } else {\n            options = options ? assign({}, options) : {};\n            options.collection = this;\n            var model = new this.model(attrs, options);\n            if (!model.validationError) return model;\n            this.trigger('invalid', this, model.validationError, options);\n            return false;\n        }\n    },\n\n    _deIndex: function (model, attribute, value) {\n        var indexVal;\n        if (attribute !== undefined) {\n            if (undefined === this._indexes[attribute]) throw new Error('Given attribute is not an index');\n            delete this._indexes[attribute][value];\n            return;\n        }\n        // Not a specific attribute\n        for (var indexAttr in this._indexes) {\n            indexVal = model.hasOwnProperty(indexAttr) ? model[indexAttr] : (model.get && model.get(indexAttr));\n            delete this._indexes[indexAttr][indexVal];\n        }\n    },\n\n    _index: function (model, attribute) {\n        var indexVal;\n        if (attribute !== undefined) {\n            if (undefined === this._indexes[attribute]) throw new Error('Given attribute is not an index');\n            indexVal = model[attribute] || (model.get && model.get(attribute));\n            if (indexVal) this._indexes[attribute][indexVal] = model;\n            return;\n        }\n        // Not a specific attribute\n        for (var indexAttr in this._indexes) {\n            indexVal = model.hasOwnProperty(indexAttr) ? model[indexAttr] : (model.get && model.get(indexAttr));\n            if (indexVal != null) this._indexes[indexAttr][indexVal] = model;\n        }\n    },\n\n    _isDerivedIndex: function(proto) {\n        if (!proto || typeof proto._derived !== 'object') {\n            return false;\n        }\n        return Object.keys(proto._derived).indexOf(this.mainIndex) >= 0;\n    },\n\n    // Internal method to create a model's ties to a collection.\n    _addReference: function (model, options) {\n        this._index(model);\n        if (!model.collection) model.collection = this;\n        if (model.on) model.on('all', this._onModelEvent, this);\n    },\n\n        // Internal method to sever a model's ties to a collection.\n    _removeReference: function (model, options) {\n        if (this === model.collection) delete model.collection;\n        this._deIndex(model);\n        if (model.off) model.off('all', this._onModelEvent, this);\n    },\n\n    _onModelEvent: function (event, model, collection, options) {\n        var eventName = event.split(':')[0];\n        var attribute = event.split(':')[1];\n\n        if ((eventName === 'add' || eventName === 'remove') && collection !== this) return;\n        if (eventName === 'destroy') this.remove(model, options);\n        if (model && eventName === 'change' && attribute && this._indexes[attribute]) {\n            this._deIndex(model, attribute, model.previousAttributes()[attribute]);\n            this._index(model, attribute);\n        }\n        this.trigger.apply(this, arguments);\n    }\n});\n\nObject.defineProperties(Collection.prototype, {\n    length: {\n        get: function () {\n            return this.models.length;\n        }\n    },\n    isCollection: {\n        get: function () {\n            return true;\n        }\n    }\n});\n\nvar arrayMethods = [\n    'indexOf',\n    'lastIndexOf',\n    'every',\n    'some',\n    'forEach',\n    'map',\n    'filter',\n    'reduce',\n    'reduceRight'\n];\n\narrayMethods.forEach(function (method) {\n    Collection.prototype[method] = function () {\n        return this.models[method].apply(this.models, arguments);\n    };\n});\n\n// alias each/forEach for maximum compatibility\nCollection.prototype.each = Collection.prototype.forEach;\n\nCollection.extend = classExtend;\n\nmodule.exports = Collection;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiN2JkMy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9hbXBlcnNhbmQtY29sbGVjdGlvbi9hbXBlcnNhbmQtY29sbGVjdGlvbi5qcz9hMDhiIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBBbXBlcnNhbmRFdmVudHMgPSByZXF1aXJlKCdhbXBlcnNhbmQtZXZlbnRzJyk7XG52YXIgY2xhc3NFeHRlbmQgPSByZXF1aXJlKCdhbXBlcnNhbmQtY2xhc3MtZXh0ZW5kJyk7XG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2xvZGFzaC9pc0FycmF5Jyk7XG52YXIgYmluZCA9IHJlcXVpcmUoJ2xvZGFzaC9iaW5kJyk7XG52YXIgYXNzaWduID0gcmVxdWlyZSgnbG9kYXNoL2Fzc2lnbicpO1xudmFyIHNsaWNlID0gW10uc2xpY2U7XG5cbmZ1bmN0aW9uIENvbGxlY3Rpb24obW9kZWxzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBpZiAob3B0aW9ucy5tb2RlbCkgdGhpcy5tb2RlbCA9IG9wdGlvbnMubW9kZWw7XG4gICAgaWYgKG9wdGlvbnMuY29tcGFyYXRvcikgdGhpcy5jb21wYXJhdG9yID0gb3B0aW9ucy5jb21wYXJhdG9yO1xuICAgIGlmIChvcHRpb25zLnBhcmVudCkgdGhpcy5wYXJlbnQgPSBvcHRpb25zLnBhcmVudDtcbiAgICBpZiAoIXRoaXMubWFpbkluZGV4KSB7XG4gICAgICAgIHZhciBpZEF0dHJpYnV0ZSA9IHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5wcm90b3R5cGUgJiYgdGhpcy5tb2RlbC5wcm90b3R5cGUuaWRBdHRyaWJ1dGU7XG4gICAgICAgIHRoaXMubWFpbkluZGV4ID0gaWRBdHRyaWJ1dGUgfHwgJ2lkJztcbiAgICB9XG4gICAgdGhpcy5fcmVzZXQoKTtcbiAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAobW9kZWxzKSB0aGlzLnJlc2V0KG1vZGVscywgYXNzaWduKHtzaWxlbnQ6IHRydWV9LCBvcHRpb25zKSk7XG59XG5cbmFzc2lnbihDb2xsZWN0aW9uLnByb3RvdHlwZSwgQW1wZXJzYW5kRXZlbnRzLCB7XG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge30sXG5cbiAgICBpc01vZGVsOiBmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwgJiYgbW9kZWwgaW5zdGFuY2VvZiB0aGlzLm1vZGVsO1xuICAgIH0sXG5cbiAgICBhZGQ6IGZ1bmN0aW9uIChtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0KG1vZGVscywgYXNzaWduKHttZXJnZTogZmFsc2UsIGFkZDogdHJ1ZSwgcmVtb3ZlOiBmYWxzZX0sIG9wdGlvbnMpKTtcbiAgICB9LFxuXG4gICAgLy8gb3ZlcnJpZGFibGUgcGFyc2UgbWV0aG9kXG4gICAgcGFyc2U6IGZ1bmN0aW9uIChyZXMsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgLy8gb3ZlcnJpZGFibGUgc2VyaWFsaXplIG1ldGhvZFxuICAgIHNlcmlhbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICAgICAgICBpZiAobW9kZWwuc2VyaWFsaXplKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vZGVsLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0ID0ge307XG4gICAgICAgICAgICAgICAgYXNzaWduKG91dCwgbW9kZWwpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBvdXQuY29sbGVjdGlvbjtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlcmlhbGl6ZSgpO1xuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uIChtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IGFzc2lnbih7YWRkOiB0cnVlLCByZW1vdmU6IHRydWUsIG1lcmdlOiB0cnVlfSwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChvcHRpb25zLnBhcnNlKSBtb2RlbHMgPSB0aGlzLnBhcnNlKG1vZGVscywgb3B0aW9ucyk7XG4gICAgICAgIHZhciBzaW5ndWxhciA9ICFpc0FycmF5KG1vZGVscyk7XG4gICAgICAgIG1vZGVscyA9IHNpbmd1bGFyID8gKG1vZGVscyA/IFttb2RlbHNdIDogW10pIDogbW9kZWxzLnNsaWNlKCk7XG4gICAgICAgIHZhciBpZCwgbW9kZWwsIGF0dHJzLCBleGlzdGluZywgc29ydCwgaSwgbGVuZ3RoO1xuICAgICAgICB2YXIgYXQgPSBvcHRpb25zLmF0O1xuICAgICAgICB2YXIgc29ydGFibGUgPSB0aGlzLmNvbXBhcmF0b3IgJiYgKGF0ID09IG51bGwpICYmIG9wdGlvbnMuc29ydCAhPT0gZmFsc2U7XG4gICAgICAgIHZhciBzb3J0QXR0ciA9ICgnc3RyaW5nJyA9PT0gdHlwZW9mIHRoaXMuY29tcGFyYXRvcikgPyB0aGlzLmNvbXBhcmF0b3IgOiBudWxsO1xuICAgICAgICB2YXIgdG9BZGQgPSBbXSwgdG9SZW1vdmUgPSBbXSwgbW9kZWxNYXAgPSB7fTtcbiAgICAgICAgdmFyIGFkZCA9IG9wdGlvbnMuYWRkLCBtZXJnZSA9IG9wdGlvbnMubWVyZ2UsIHJlbW92ZSA9IG9wdGlvbnMucmVtb3ZlO1xuICAgICAgICB2YXIgb3JkZXIgPSAhc29ydGFibGUgJiYgYWRkICYmIHJlbW92ZSA/IFtdIDogZmFsc2U7XG4gICAgICAgIHZhciB0YXJnZXRQcm90byA9IHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5wcm90b3R5cGUgfHwgT2JqZWN0LnByb3RvdHlwZTtcblxuICAgICAgICAvLyBUdXJuIGJhcmUgb2JqZWN0cyBpbnRvIG1vZGVsIHJlZmVyZW5jZXMsIGFuZCBwcmV2ZW50IGludmFsaWQgbW9kZWxzXG4gICAgICAgIC8vIGZyb20gYmVpbmcgYWRkZWQuXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IG1vZGVscy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXR0cnMgPSBtb2RlbHNbaV0gfHwge307XG4gICAgICAgICAgICBpZiAodGhpcy5pc01vZGVsKGF0dHJzKSkge1xuICAgICAgICAgICAgICAgIGlkID0gbW9kZWwgPSBhdHRycztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0UHJvdG8uZ2VuZXJhdGVJZCkge1xuICAgICAgICAgICAgICAgIGlkID0gdGFyZ2V0UHJvdG8uZ2VuZXJhdGVJZChhdHRycyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlkID0gYXR0cnNbdGhpcy5tYWluSW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX2lzRGVyaXZlZEluZGV4KHRhcmdldFByb3RvKSkge1xuICAgICAgICAgICAgICAgICAgICBpZCA9IHRhcmdldFByb3RvLl9kZXJpdmVkW3RoaXMubWFpbkluZGV4XS5mbi5jYWxsKGF0dHJzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIGEgZHVwbGljYXRlIGlzIGZvdW5kLCBwcmV2ZW50IGl0IGZyb20gYmVpbmcgYWRkZWQgYW5kXG4gICAgICAgICAgICAvLyBvcHRpb25hbGx5IG1lcmdlIGl0IGludG8gdGhlIGV4aXN0aW5nIG1vZGVsLlxuICAgICAgICAgICAgaWYgKGV4aXN0aW5nID0gdGhpcy5nZXQoaWQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlbW92ZSkgbW9kZWxNYXBbZXhpc3RpbmcuY2lkIHx8IGV4aXN0aW5nW3RoaXMubWFpbkluZGV4XV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChtZXJnZSkge1xuICAgICAgICAgICAgICAgICAgICBhdHRycyA9IGF0dHJzID09PSBtb2RlbCA/IG1vZGVsLmF0dHJpYnV0ZXMgOiBhdHRycztcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucGFyc2UpIGF0dHJzID0gZXhpc3RpbmcucGFyc2UoYXR0cnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGlzIG1vZGVsXG4gICAgICAgICAgICAgICAgICAgIGlmIChleGlzdGluZy5zZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nLnNldChhdHRycywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc29ydGFibGUgJiYgIXNvcnQgJiYgZXhpc3RpbmcuaGFzQ2hhbmdlZChzb3J0QXR0cikpIHNvcnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgbm90IGp1c3QgdXBkYXRlIHRoZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ24oZXhpc3RpbmcsIGF0dHJzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2RlbHNbaV0gPSBleGlzdGluZztcblxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIG5ldywgdmFsaWQgbW9kZWwsIHB1c2ggaXQgdG8gdGhlIGB0b0FkZGAgbGlzdC5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWRkKSB7XG4gICAgICAgICAgICAgICAgbW9kZWwgPSBtb2RlbHNbaV0gPSB0aGlzLl9wcmVwYXJlTW9kZWwoYXR0cnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGlmICghbW9kZWwpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHRvQWRkLnB1c2gobW9kZWwpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZFJlZmVyZW5jZShtb2RlbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvIG5vdCBhZGQgbXVsdGlwbGUgbW9kZWxzIHdpdGggdGhlIHNhbWUgYGlkYC5cbiAgICAgICAgICAgIG1vZGVsID0gZXhpc3RpbmcgfHwgbW9kZWw7XG4gICAgICAgICAgICBpZiAoIW1vZGVsKSBjb250aW51ZTtcbiAgICAgICAgICAgIGlmIChvcmRlciAmJiAoKG1vZGVsLmlzTmV3ICYmIG1vZGVsLmlzTmV3KCkgfHwgIW1vZGVsW3RoaXMubWFpbkluZGV4XSkgfHwgIW1vZGVsTWFwW21vZGVsLmNpZCB8fCBtb2RlbFt0aGlzLm1haW5JbmRleF1dKSkgb3JkZXIucHVzaChtb2RlbCk7XG4gICAgICAgICAgICBtb2RlbE1hcFttb2RlbFt0aGlzLm1haW5JbmRleF1dID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSBub25leGlzdGVudCBtb2RlbHMgaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgIGlmIChyZW1vdmUpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBtb2RlbCA9IHRoaXMubW9kZWxzW2ldO1xuICAgICAgICAgICAgICAgIGlmICghbW9kZWxNYXBbbW9kZWwuY2lkIHx8IG1vZGVsW3RoaXMubWFpbkluZGV4XV0pIHRvUmVtb3ZlLnB1c2gobW9kZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRvUmVtb3ZlLmxlbmd0aCkgdGhpcy5yZW1vdmUodG9SZW1vdmUsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICAvLyBBZGQgaW5kZXhlcyBhZ2FpbiB0byBtYWtlIHN1cmUgdGhleSB3ZXJlIG5vdCByZW1vdmVkIGFib3ZlLlxuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gdG9BZGQubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCh0b0FkZFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWUgaWYgc29ydGluZyBpcyBuZWVkZWQsIHVwZGF0ZSBgbGVuZ3RoYCBhbmQgc3BsaWNlIGluIG5ldyBtb2RlbHMuXG4gICAgICAgIGlmICh0b0FkZC5sZW5ndGggfHwgKG9yZGVyICYmIG9yZGVyLmxlbmd0aCkpIHtcbiAgICAgICAgICAgIGlmIChzb3J0YWJsZSkgc29ydCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoYXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IHRvQWRkLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW9kZWxzLnNwbGljZShhdCArIGksIDAsIHRvQWRkW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBvcmRlcmVkTW9kZWxzID0gb3JkZXIgfHwgdG9BZGQ7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gb3JkZXJlZE1vZGVscy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vZGVscy5wdXNoKG9yZGVyZWRNb2RlbHNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNpbGVudGx5IHNvcnQgdGhlIGNvbGxlY3Rpb24gaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgIGlmIChzb3J0KSB0aGlzLnNvcnQoe3NpbGVudDogdHJ1ZX0pO1xuXG4gICAgICAgIC8vIFVubGVzcyBzaWxlbmNlZCwgaXQncyB0aW1lIHRvIGZpcmUgYWxsIGFwcHJvcHJpYXRlIGFkZC9zb3J0IGV2ZW50cy5cbiAgICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0gdG9BZGQubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBtb2RlbCA9IHRvQWRkW2ldO1xuICAgICAgICAgICAgICAgIGlmIChtb2RlbC50cmlnZ2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLnRyaWdnZXIoJ2FkZCcsIG1vZGVsLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2FkZCcsIG1vZGVsLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc29ydCB8fCAob3JkZXIgJiYgb3JkZXIubGVuZ3RoKSkgdGhpcy50cmlnZ2VyKCdzb3J0JywgdGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGFkZGVkIChvciBtZXJnZWQpIG1vZGVsIChvciBtb2RlbHMpLlxuICAgICAgICByZXR1cm4gc2luZ3VsYXIgPyBtb2RlbHNbMF0gOiBtb2RlbHM7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24gKHF1ZXJ5LCBpbmRleE5hbWUpIHtcbiAgICAgICAgaWYgKHF1ZXJ5ID09IG51bGwpIHJldHVybjtcblxuICAgICAgICB2YXIgY29sbGVjdGlvbk1haW5JbmRleCA9IHRoaXMubWFpbkluZGV4O1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9pbmRleGVzW2luZGV4TmFtZSB8fCBjb2xsZWN0aW9uTWFpbkluZGV4XTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIGluZGV4ICYmIChcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhbcXVlcnldIHx8IChcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5W2NvbGxlY3Rpb25NYWluSW5kZXhdICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4W3F1ZXJ5W2NvbGxlY3Rpb25NYWluSW5kZXhdXVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKSB8fFxuICAgICAgICAgICAgdGhpcy5faW5kZXhlcy5jaWRbcXVlcnldIHx8XG4gICAgICAgICAgICB0aGlzLl9pbmRleGVzLmNpZFtxdWVyeS5jaWRdXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgbW9kZWwgYXQgdGhlIGdpdmVuIGluZGV4LlxuICAgIGF0OiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWxzW2luZGV4XTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAobW9kZWxzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBzaW5ndWxhciA9ICFpc0FycmF5KG1vZGVscyk7XG4gICAgICAgIHZhciBpLCBsZW5ndGgsIG1vZGVsLCBpbmRleDtcblxuICAgICAgICBtb2RlbHMgPSBzaW5ndWxhciA/IFttb2RlbHNdIDogc2xpY2UuY2FsbChtb2RlbHMpO1xuICAgICAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW5ndGggPSBtb2RlbHMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG1vZGVsID0gbW9kZWxzW2ldID0gdGhpcy5nZXQobW9kZWxzW2ldKTtcbiAgICAgICAgICAgIGlmICghbW9kZWwpIGNvbnRpbnVlO1xuICAgICAgICAgICAgdGhpcy5fZGVJbmRleChtb2RlbCk7XG4gICAgICAgICAgICBpbmRleCA9IHRoaXMubW9kZWxzLmluZGV4T2YobW9kZWwpO1xuICAgICAgICAgICAgdGhpcy5tb2RlbHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsLnRyaWdnZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwudHJpZ2dlcigncmVtb3ZlJywgbW9kZWwsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcigncmVtb3ZlJywgbW9kZWwsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZVJlZmVyZW5jZShtb2RlbCwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpbmd1bGFyID8gbW9kZWxzWzBdIDogbW9kZWxzO1xuICAgIH0sXG5cbiAgICAvLyBXaGVuIHlvdSBoYXZlIG1vcmUgaXRlbXMgdGhhbiB5b3Ugd2FudCB0byBhZGQgb3IgcmVtb3ZlIGluZGl2aWR1YWxseSxcbiAgICAvLyB5b3UgY2FuIHJlc2V0IHRoZSBlbnRpcmUgc2V0IHdpdGggYSBuZXcgbGlzdCBvZiBtb2RlbHMsIHdpdGhvdXQgZmlyaW5nXG4gICAgLy8gYW55IGdyYW51bGFyIGBhZGRgIG9yIGByZW1vdmVgIGV2ZW50cy4gRmlyZXMgYHJlc2V0YCB3aGVuIGZpbmlzaGVkLlxuICAgIC8vIFVzZWZ1bCBmb3IgYnVsayBvcGVyYXRpb25zIGFuZCBvcHRpbWl6YXRpb25zLlxuICAgIHJlc2V0OiBmdW5jdGlvbiAobW9kZWxzLCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSB0aGlzLm1vZGVscy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlUmVmZXJlbmNlKHRoaXMubW9kZWxzW2ldLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zLnByZXZpb3VzTW9kZWxzID0gdGhpcy5tb2RlbHM7XG4gICAgICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgICAgIG1vZGVscyA9IHRoaXMuYWRkKG1vZGVscywgYXNzaWduKHtzaWxlbnQ6IHRydWV9LCBvcHRpb25zKSk7XG4gICAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMudHJpZ2dlcigncmVzZXQnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIG1vZGVscztcbiAgICB9LFxuXG4gICAgc29ydDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIXRoaXMuY29tcGFyYXRvcikgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc29ydCBhIHNldCB3aXRob3V0IGEgY29tcGFyYXRvcicpO1xuICAgICAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb21wYXJhdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5tb2RlbHMuc29ydChmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICAgICAgICBpZiAobGVmdC5nZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGxlZnQuZ2V0KHNlbGYuY29tcGFyYXRvcik7XG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gcmlnaHQuZ2V0KHNlbGYuY29tcGFyYXRvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGxlZnRbc2VsZi5jb21wYXJhdG9yXTtcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSByaWdodFtzZWxmLmNvbXBhcmF0b3JdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobGVmdCA+IHJpZ2h0IHx8IGxlZnQgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgaWYgKGxlZnQgPCByaWdodCB8fCByaWdodCA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbXBhcmF0b3IubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVscy5zb3J0KGZ1bmN0aW9uIChsZWZ0LCByaWdodCkge1xuICAgICAgICAgICAgICAgIGxlZnQgPSBzZWxmLmNvbXBhcmF0b3IobGVmdCk7XG4gICAgICAgICAgICAgICAgcmlnaHQgPSBzZWxmLmNvbXBhcmF0b3IocmlnaHQpO1xuICAgICAgICAgICAgICAgIGlmIChsZWZ0ID4gcmlnaHQgfHwgbGVmdCA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICBpZiAobGVmdCA8IHJpZ2h0IHx8IHJpZ2h0ID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tb2RlbHMuc29ydChiaW5kKHRoaXMuY29tcGFyYXRvcix0aGlzKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLnRyaWdnZXIoJ3NvcnQnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFByaXZhdGUgbWV0aG9kIHRvIHJlc2V0IGFsbCBpbnRlcm5hbCBzdGF0ZS4gQ2FsbGVkIHdoZW4gdGhlIGNvbGxlY3Rpb25cbiAgICAvLyBpcyBmaXJzdCBpbml0aWFsaXplZCBvciByZXNldC5cbiAgICBfcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGxpc3QgPSBzbGljZS5jYWxsKHRoaXMuaW5kZXhlcyB8fCBbXSk7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgbGlzdC5wdXNoKHRoaXMubWFpbkluZGV4KTtcbiAgICAgICAgbGlzdC5wdXNoKCdjaWQnKTtcbiAgICAgICAgdmFyIGwgPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdGhpcy5tb2RlbHMgPSBbXTtcbiAgICAgICAgdGhpcy5faW5kZXhlcyA9IHt9O1xuICAgICAgICBmb3IgKDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5faW5kZXhlc1tsaXN0W2ldXSA9IHt9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9wcmVwYXJlTW9kZWw6IGZ1bmN0aW9uIChhdHRycywgb3B0aW9ucykge1xuICAgICAgICAvLyBpZiB3ZSBoYXZlbid0IGRlZmluZWQgYSBjb25zdHJ1Y3Rvciwgc2tpcCB0aGlzXG4gICAgICAgIGlmICghdGhpcy5tb2RlbCkgcmV0dXJuIGF0dHJzO1xuXG4gICAgICAgIGlmICh0aGlzLmlzTW9kZWwoYXR0cnMpKSB7XG4gICAgICAgICAgICBpZiAoIWF0dHJzLmNvbGxlY3Rpb24pIGF0dHJzLmNvbGxlY3Rpb24gPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIGF0dHJzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBhc3NpZ24oe30sIG9wdGlvbnMpIDoge307XG4gICAgICAgICAgICBvcHRpb25zLmNvbGxlY3Rpb24gPSB0aGlzO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gbmV3IHRoaXMubW9kZWwoYXR0cnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFtb2RlbC52YWxpZGF0aW9uRXJyb3IpIHJldHVybiBtb2RlbDtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcignaW52YWxpZCcsIHRoaXMsIG1vZGVsLnZhbGlkYXRpb25FcnJvciwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2RlSW5kZXg6IGZ1bmN0aW9uIChtb2RlbCwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgICAgICB2YXIgaW5kZXhWYWw7XG4gICAgICAgIGlmIChhdHRyaWJ1dGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gdGhpcy5faW5kZXhlc1thdHRyaWJ1dGVdKSB0aHJvdyBuZXcgRXJyb3IoJ0dpdmVuIGF0dHJpYnV0ZSBpcyBub3QgYW4gaW5kZXgnKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9pbmRleGVzW2F0dHJpYnV0ZV1bdmFsdWVdO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdCBhIHNwZWNpZmljIGF0dHJpYnV0ZVxuICAgICAgICBmb3IgKHZhciBpbmRleEF0dHIgaW4gdGhpcy5faW5kZXhlcykge1xuICAgICAgICAgICAgaW5kZXhWYWwgPSBtb2RlbC5oYXNPd25Qcm9wZXJ0eShpbmRleEF0dHIpID8gbW9kZWxbaW5kZXhBdHRyXSA6IChtb2RlbC5nZXQgJiYgbW9kZWwuZ2V0KGluZGV4QXR0cikpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2luZGV4ZXNbaW5kZXhBdHRyXVtpbmRleFZhbF07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2luZGV4OiBmdW5jdGlvbiAobW9kZWwsIGF0dHJpYnV0ZSkge1xuICAgICAgICB2YXIgaW5kZXhWYWw7XG4gICAgICAgIGlmIChhdHRyaWJ1dGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gdGhpcy5faW5kZXhlc1thdHRyaWJ1dGVdKSB0aHJvdyBuZXcgRXJyb3IoJ0dpdmVuIGF0dHJpYnV0ZSBpcyBub3QgYW4gaW5kZXgnKTtcbiAgICAgICAgICAgIGluZGV4VmFsID0gbW9kZWxbYXR0cmlidXRlXSB8fCAobW9kZWwuZ2V0ICYmIG1vZGVsLmdldChhdHRyaWJ1dGUpKTtcbiAgICAgICAgICAgIGlmIChpbmRleFZhbCkgdGhpcy5faW5kZXhlc1thdHRyaWJ1dGVdW2luZGV4VmFsXSA9IG1vZGVsO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIE5vdCBhIHNwZWNpZmljIGF0dHJpYnV0ZVxuICAgICAgICBmb3IgKHZhciBpbmRleEF0dHIgaW4gdGhpcy5faW5kZXhlcykge1xuICAgICAgICAgICAgaW5kZXhWYWwgPSBtb2RlbC5oYXNPd25Qcm9wZXJ0eShpbmRleEF0dHIpID8gbW9kZWxbaW5kZXhBdHRyXSA6IChtb2RlbC5nZXQgJiYgbW9kZWwuZ2V0KGluZGV4QXR0cikpO1xuICAgICAgICAgICAgaWYgKGluZGV4VmFsICE9IG51bGwpIHRoaXMuX2luZGV4ZXNbaW5kZXhBdHRyXVtpbmRleFZhbF0gPSBtb2RlbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfaXNEZXJpdmVkSW5kZXg6IGZ1bmN0aW9uKHByb3RvKSB7XG4gICAgICAgIGlmICghcHJvdG8gfHwgdHlwZW9mIHByb3RvLl9kZXJpdmVkICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhwcm90by5fZGVyaXZlZCkuaW5kZXhPZih0aGlzLm1haW5JbmRleCkgPj0gMDtcbiAgICB9LFxuXG4gICAgLy8gSW50ZXJuYWwgbWV0aG9kIHRvIGNyZWF0ZSBhIG1vZGVsJ3MgdGllcyB0byBhIGNvbGxlY3Rpb24uXG4gICAgX2FkZFJlZmVyZW5jZTogZnVuY3Rpb24gKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2luZGV4KG1vZGVsKTtcbiAgICAgICAgaWYgKCFtb2RlbC5jb2xsZWN0aW9uKSBtb2RlbC5jb2xsZWN0aW9uID0gdGhpcztcbiAgICAgICAgaWYgKG1vZGVsLm9uKSBtb2RlbC5vbignYWxsJywgdGhpcy5fb25Nb2RlbEV2ZW50LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgICAgIC8vIEludGVybmFsIG1ldGhvZCB0byBzZXZlciBhIG1vZGVsJ3MgdGllcyB0byBhIGNvbGxlY3Rpb24uXG4gICAgX3JlbW92ZVJlZmVyZW5jZTogZnVuY3Rpb24gKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgICAgIGlmICh0aGlzID09PSBtb2RlbC5jb2xsZWN0aW9uKSBkZWxldGUgbW9kZWwuY29sbGVjdGlvbjtcbiAgICAgICAgdGhpcy5fZGVJbmRleChtb2RlbCk7XG4gICAgICAgIGlmIChtb2RlbC5vZmYpIG1vZGVsLm9mZignYWxsJywgdGhpcy5fb25Nb2RlbEV2ZW50LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgX29uTW9kZWxFdmVudDogZnVuY3Rpb24gKGV2ZW50LCBtb2RlbCwgY29sbGVjdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgZXZlbnROYW1lID0gZXZlbnQuc3BsaXQoJzonKVswXTtcbiAgICAgICAgdmFyIGF0dHJpYnV0ZSA9IGV2ZW50LnNwbGl0KCc6JylbMV07XG5cbiAgICAgICAgaWYgKChldmVudE5hbWUgPT09ICdhZGQnIHx8IGV2ZW50TmFtZSA9PT0gJ3JlbW92ZScpICYmIGNvbGxlY3Rpb24gIT09IHRoaXMpIHJldHVybjtcbiAgICAgICAgaWYgKGV2ZW50TmFtZSA9PT0gJ2Rlc3Ryb3knKSB0aGlzLnJlbW92ZShtb2RlbCwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChtb2RlbCAmJiBldmVudE5hbWUgPT09ICdjaGFuZ2UnICYmIGF0dHJpYnV0ZSAmJiB0aGlzLl9pbmRleGVzW2F0dHJpYnV0ZV0pIHtcbiAgICAgICAgICAgIHRoaXMuX2RlSW5kZXgobW9kZWwsIGF0dHJpYnV0ZSwgbW9kZWwucHJldmlvdXNBdHRyaWJ1dGVzKClbYXR0cmlidXRlXSk7XG4gICAgICAgICAgICB0aGlzLl9pbmRleChtb2RlbCwgYXR0cmlidXRlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyaWdnZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoQ29sbGVjdGlvbi5wcm90b3R5cGUsIHtcbiAgICBsZW5ndGg6IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tb2RlbHMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpc0NvbGxlY3Rpb246IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG52YXIgYXJyYXlNZXRob2RzID0gW1xuICAgICdpbmRleE9mJyxcbiAgICAnbGFzdEluZGV4T2YnLFxuICAgICdldmVyeScsXG4gICAgJ3NvbWUnLFxuICAgICdmb3JFYWNoJyxcbiAgICAnbWFwJyxcbiAgICAnZmlsdGVyJyxcbiAgICAncmVkdWNlJyxcbiAgICAncmVkdWNlUmlnaHQnXG5dO1xuXG5hcnJheU1ldGhvZHMuZm9yRWFjaChmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWxzW21ldGhvZF0uYXBwbHkodGhpcy5tb2RlbHMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn0pO1xuXG4vLyBhbGlhcyBlYWNoL2ZvckVhY2ggZm9yIG1heGltdW0gY29tcGF0aWJpbGl0eVxuQ29sbGVjdGlvbi5wcm90b3R5cGUuZWFjaCA9IENvbGxlY3Rpb24ucHJvdG90eXBlLmZvckVhY2g7XG5cbkNvbGxlY3Rpb24uZXh0ZW5kID0gY2xhc3NFeHRlbmQ7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdGlvbjtcbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///7bd3\n")}}]);