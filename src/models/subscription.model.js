import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {     //one who is subscribing (you)
        type: Schema.Types.ObjectId,
        ref: "User"
   },

    channel: {      // owner of channel, whom a subscriber will subscribe
        type: Schema.Types.ObjectId,   //channel is simply a user who is uploading videos, that is why refrencing to "User" model
        ref: "User"
    }
},{timestamps: true}); 

const Subscription = mongoose.model("Subscription", subscriptionSchema); 

export default Subscription; 