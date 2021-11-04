const User = require('../schemas/User');

const { customErrorResponse } = require('../utils/responses');

const validImageExtensions = [ 'jpg', 'jpeg', 'png'];
const validAudioExtensions = [ 'mp3', 'wav', 'wma'];
const validRecordTypes = [ 'single', 'ep' , 'album'];

const fileValidator = (req, res, next) => {
    if(!req.files) {
        return customErrorResponse(res, "File not sent", 400);
    }
    if(!req.files.file){
        return customErrorResponse(res, "File not sent correctly", 400);
    }
    next();
}

const imageExtensionMiddleware = (req, res, next) => {

    let extension = req.files.file.name.split('.');
    extension = extension[extension.length -1];

    if(!validImageExtensions.includes(extension)){
        return customErrorResponse(res, "Invalid extension", 400);
    }

    next();

}

const audioExtensionMiddleware = (req, res, next) => {

    let extension = req.files.file.name.split('.');
    extension = extension[extension.length -1];

    if(validAudioExtensions.includes(extension)){
        return customErrorResponse(res, "Invalid extension", 400);
    }

    next();

}

const validRecordType = type => {

    if (!validRecordTypes.includes(type)) {
        throw new Error('Invalid record type');
    }

}

const userAlreadySubscribed = async (req, res, next) => {

    const { userToSubscribeId } = req.query;
    const user = req.user;

    const userSubscribed = await subscriberQuery(user._id, userToSubscribeId);

    if (userSubscribed) {
        return customErrorResponse(res, "User already subscribed", 400);
    }

    next();

}

const userIsNotSubscribed = async (req, res, next) => {

    const { userToUnsubscribeId } = req.query;
    const user = req.user;

    const userUnsubscribed = await subscriberQuery(user._id, userToUnsubscribeId);

    if (!userUnsubscribed) {
        return customErrorResponse(res, "User is not subscribed", 400);
    }

    next();

}

const subscriberQuery = async ( userLoggedId, userToSubscribeId) => {
    return await User.findOne({
        _id: userToSubscribeId,
        userSubscribers: {
            $in: [userLoggedId]
        }
    }).exec();
}

const differentUserSubscribe = (req, res, next) => {
    const { userToSubscribeId } = req.query;
    const user = req.user;
    if (user._id == userToSubscribeId) {
        return customErrorResponse(res, "You cannot subscribe to yourself", 400);
    }
    next();
}

const differentUserUnsubscribe = (req, res, next) => {
    const { userToUnsubscribeId } = req.query;
    const user = req.user;
    if (user._id == userToUnsubscribeId) {
        return customErrorResponse(res, "You cannot unsubscribe to yourself", 400);
    }
    next();
}

module.exports = {
    fileValidator,
    imageExtensionMiddleware,
    audioExtensionMiddleware,
    validRecordType,
    userAlreadySubscribed,
    userIsNotSubscribed,
    differentUserSubscribe,
    differentUserUnsubscribe
};