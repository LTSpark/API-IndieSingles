const mongoose = require('mongoose');

const Song = require('../../../schemas/Song');
const User = require('../../../schemas/User');

const { cloudinaryAudioUpload } = require('../../../services/cloudinaryAudioUpload');
const { cloudinaryImageUpload } = require('../../../services/cloudinaryImageUpload');
const { publishSNSTopic } = require('../../../services/publishSNSTopic');
const { customResponse, errorResponse} = require('../../../utils/responses');

const postSongFlow = async(req, res) => {

    const {
        name,
        description,
        genre
    } = req.body;

    const songUrl = await cloudinaryAudioUpload(req.files.song);
    const songImage = await cloudinaryImageUpload(req.files.file);
    const songUserId = req.user._id;

    const song = new Song({
        name,
        description,
        genre,
        songUrl,
        songUser: songUserId,
        songImage,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        await song.save();

        await User.findByIdAndUpdate(songUserId,{
            $addToSet: {
                userSongs: song._id
            }
        }).exec();

        publishSNSTopic(req.user.topicArn, formatMessage(song, req.user));
        
        session.commitTransaction();
        return customResponse(res, "Song created successfully", 201);

    } catch (error) {

        console.log(error);
        await session.abortTransaction();
        return errorResponse(res, "Song creation failed: contact administrator", error, 500);

    }
    finally{
        session.endSession();
    }

}

const formatMessage = (song, user) => {

    return `Hi! We want to show you the brand new song by one of the artists that you are subscribe to.
${user.name} has uploaded a ${song.genre} song named ${song.name}
Description: ${song.description}
Release date: ${song.createdAt}.
You can listen to it at ${song.songUrl}`;
    
}

module.exports = postSongFlow;
