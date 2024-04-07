# `VideoPlatform` backend built using Node.js, Express.js, and Mongodb Database

This backend framework, developed using `Node.js` and `Express.js`, seamlessly integrates with `MongoDB` database. It provides a comprehensive set of endpoints to facilitate the operation of `VideoPlatform` related functionalities.

![Frameworks](https://skillicons.dev/icons?i=js,nodejs,express,mongodb&perline=16)

Features ➝ `RESTful API` architecture, `MongoDB database integration with Mongoose`, and `JSON Web Token (JWT) based authentication`

<br>

### This backend is consists of Endpoints (CRUD) related to `User`, `Videos`, `Subscriptions`,`Comments`, `Playlists` and `Likes`.
- Database collections are efficiently linked through well-constructed `aggregation pipelines` within the controllers.
- `Cloudinary` services is used to store all media files, ensuring efficient handling and management of multimedia content.
- Backend utilizes environment variables (tokens and keys) stored in the `.env` file for secure configuration management.

<br>

## Endpoints

### `Users`
- registerUser ➝ `/api/v1/users/register`
- loginUser ➝ `/api/v1/users/login`
- logoutUser ➝ `/api/v1/users/logout`
- refreshAccessToken ➝ `/api/v1/users/refresh-token`
- getCurrentUser ➝ `/api/v1/users/get-user`
- changeCurrentPassword ➝ `/api/v1/users/change-password`
- updateUserDetails ➝ `/api/v1/users/update-details`
- updateUserImages ➝ `/api/v1/users/image-update`
- getUserChannelDetails ➝ `/api/v1/users/channel/:username`
- getWatchedHistory ➝ `/api/v1/users/watched`

### `Videos` 


### `Comments`

### `Subscriptions`
