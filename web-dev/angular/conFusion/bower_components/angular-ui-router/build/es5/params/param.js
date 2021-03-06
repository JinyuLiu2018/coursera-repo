var common_1 = require("../common/common");
var coreservices_1 = require("../common/coreservices");
var urlMatcherConfig_1 = require("../url/urlMatcherConfig");
var type_1 = require("./type");
var paramTypes_1 = require("./paramTypes");
var hasOwn = Object.prototype.hasOwnProperty;
var isShorthand = function (cfg) { return ["value", "type", "squash", "array", "dynamic"].filter(hasOwn.bind(cfg || {})).length === 0; };
var DefType;
(function (DefType) {
    DefType[DefType["PATH"] = 0] = "PATH";
    DefType[DefType["SEARCH"] = 1] = "SEARCH";
    DefType[DefType["CONFIG"] = 2] = "CONFIG";
})(DefType || (DefType = {}));
var Param = (function () {
    function Param(id, type, config, location) {
        config = unwrapShorthand(config);
        type = getType(config, type, location);
        var arrayMode = getArrayMode();
        type = arrayMode ? type.$asArray(arrayMode, location === DefType.SEARCH) : type;
        var isOptional = config.value !== undefined;
        var dynamic = config.dynamic === true;
        var squash = getSquashPolicy(config, isOptional);
        var replace = getReplace(config, arrayMode, isOptional, squash);
        function unwrapShorthand(config) {
            config = isShorthand(config) && { value: config } || config;
            return common_1.extend(config, {
                $$fn: common_1.isInjectable(config.value) ? config.value : function () { return config.value; }
            });
        }
        function getType(config, urlType, location) {
            if (config.type && urlType && urlType.name !== 'string')
                throw new Error("Param '" + id + "' has two type configurations.");
            if (config.type && urlType && urlType.name === 'string' && paramTypes_1.paramTypes.type(config.type))
                return paramTypes_1.paramTypes.type(config.type);
            if (urlType)
                return urlType;
            if (!config.type)
                return (location === DefType.CONFIG ? paramTypes_1.paramTypes.type("any") : paramTypes_1.paramTypes.type("string"));
            return config.type instanceof type_1.Type ? config.type : paramTypes_1.paramTypes.type(config.type);
        }
        function getArrayMode() {
            var arrayDefaults = { array: (location === DefType.SEARCH ? "auto" : false) };
            var arrayParamNomenclature = id.match(/\[\]$/) ? { array: true } : {};
            return common_1.extend(arrayDefaults, arrayParamNomenclature, config).array;
        }
        function getSquashPolicy(config, isOptional) {
            var squash = config.squash;
            if (!isOptional || squash === false)
                return false;
            if (!common_1.isDefined(squash) || squash == null)
                return urlMatcherConfig_1.matcherConfig.defaultSquashPolicy();
            if (squash === true || common_1.isString(squash))
                return squash;
            throw new Error("Invalid squash policy: '" + squash + "'. Valid policies: false, true, or arbitrary string");
        }
        function getReplace(config, arrayMode, isOptional, squash) {
            var replace, configuredKeys, defaultPolicy = [
                { from: "", to: (isOptional || arrayMode ? undefined : "") },
                { from: null, to: (isOptional || arrayMode ? undefined : "") }
            ];
            replace = common_1.isArray(config.replace) ? config.replace : [];
            if (common_1.isString(squash))
                replace.push({ from: squash, to: undefined });
            configuredKeys = common_1.map(replace, common_1.prop("from"));
            return common_1.filter(defaultPolicy, function (item) { return configuredKeys.indexOf(item.from) === -1; }).concat(replace);
        }
        common_1.extend(this, { id: id, type: type, location: location, squash: squash, replace: replace, isOptional: isOptional, dynamic: dynamic, config: config, array: arrayMode });
    }
    Param.prototype.isDefaultValue = function (value) {
        return this.isOptional && this.type.equals(this.value(), value);
    };
    Param.prototype.value = function (value) {
        var _this = this;
        var $$getDefaultValue = function () {
            if (!coreservices_1.services.$injector)
                throw new Error("Injectable functions cannot be called at configuration time");
            var defaultValue = coreservices_1.services.$injector.invoke(_this.config.$$fn);
            if (defaultValue !== null && defaultValue !== undefined && !_this.type.is(defaultValue))
                throw new Error("Default value (" + defaultValue + ") for parameter '" + _this.id + "' is not an instance of Type (" + _this.type.name + ")");
            return defaultValue;
        };
        var $replace = function (value) {
            var replacement = common_1.map(common_1.filter(_this.replace, common_1.propEq('from', value)), common_1.prop("to"));
            return replacement.length ? replacement[0] : value;
        };
        value = $replace(value);
        return !common_1.isDefined(value) ? $$getDefaultValue() : this.type.$normalize(value);
    };
    Param.prototype.isSearch = function () {
        return this.location === DefType.SEARCH;
    };
    Param.prototype.validates = function (value) {
        if ((!common_1.isDefined(value) || value === null) && this.isOptional)
            return true;
        var normalized = this.type.$normalize(value);
        if (!this.type.is(normalized))
            return false;
        var encoded = this.type.encode(normalized);
        if (common_1.isString(encoded) && !this.type.pattern.exec(encoded))
            return false;
        return true;
    };
    Param.prototype.toString = function () {
        return "{Param:" + this.id + " " + this.type + " squash: '" + this.squash + "' optional: " + this.isOptional + "}";
    };
    Param.fromConfig = function (id, type, config) {
        return new Param(id, type, config, DefType.CONFIG);
    };
    Param.fromPath = function (id, type, config) {
        return new Param(id, type, config, DefType.PATH);
    };
    Param.fromSearch = function (id, type, config) {
        return new Param(id, type, config, DefType.SEARCH);
    };
    Param.values = function (params, values) {
        values = values || {};
        return params.map(function (param) { return [param.id, param.value(values[param.id])]; }).reduce(common_1.applyPairs, {});
    };
    Param.equals = function (params, values1, values2) {
        values1 = values1 || {};
        values2 = values2 || {};
        return params.map(function (param) { return param.type.equals(values1[param.id], values2[param.id]); }).indexOf(false) === -1;
    };
    Param.validates = function (params, values) {
        values = values || {};
        return params.map(function (param) { return param.validates(values[param.id]); }).indexOf(false) === -1;
    };
    return Param;
})();
exports.Param = Param;
//# sourceMappingURL=param.js.map