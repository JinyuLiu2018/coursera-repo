"use strict";
var common_1 = require("../common/common");
var coreservices_1 = require("../common/coreservices");
(function (RejectType) {
    RejectType[RejectType["SUPERSEDED"] = 2] = "SUPERSEDED";
    RejectType[RejectType["ABORTED"] = 3] = "ABORTED";
    RejectType[RejectType["INVALID"] = 4] = "INVALID";
    RejectType[RejectType["IGNORED"] = 5] = "IGNORED";
})(exports.RejectType || (exports.RejectType = {}));
var RejectType = exports.RejectType;
var TransitionRejection = (function () {
    function TransitionRejection(type, message, detail) {
        common_1.extend(this, {
            type: type,
            message: message,
            detail: detail
        });
    }
    TransitionRejection.prototype.toString = function () {
        var detailString = function (d) { return d && d.toString !== Object.prototype.toString ? d.toString() : JSON.stringify(d); };
        var type = this.type, message = this.message, detail = detailString(this.detail);
        return "TransitionRejection(type: " + type + ", message: " + message + ", detail: " + detail + ")";
    };
    return TransitionRejection;
})();
exports.TransitionRejection = TransitionRejection;
var RejectFactory = (function () {
    function RejectFactory() {
    }
    RejectFactory.prototype.superseded = function (detail, options) {
        var message = "The transition has been superseded by a different transition (see detail).";
        var reason = new TransitionRejection(RejectType.SUPERSEDED, message, detail);
        if (options && options.redirected) {
            reason.redirected = true;
        }
        return common_1.extend(coreservices_1.services.$q.reject(reason), { reason: reason });
    };
    RejectFactory.prototype.redirected = function (detail) {
        return this.superseded(detail, { redirected: true });
    };
    RejectFactory.prototype.invalid = function (detail) {
        var message = "This transition is invalid (see detail)";
        var reason = new TransitionRejection(RejectType.INVALID, message, detail);
        return common_1.extend(coreservices_1.services.$q.reject(reason), { reason: reason });
    };
    RejectFactory.prototype.ignored = function (detail) {
        var message = "The transition was ignored.";
        var reason = new TransitionRejection(RejectType.IGNORED, message, detail);
        return common_1.extend(coreservices_1.services.$q.reject(reason), { reason: reason });
    };
    RejectFactory.prototype.aborted = function (detail) {
        var message = "The transition has been aborted.";
        var reason = new TransitionRejection(RejectType.ABORTED, message, detail);
        return common_1.extend(coreservices_1.services.$q.reject(reason), { reason: reason });
    };
    return RejectFactory;
})();
exports.RejectFactory = RejectFactory;
//# sourceMappingURL=rejectFactory.js.map