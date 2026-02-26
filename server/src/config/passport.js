import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import Role from "../models/Role.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      state: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // 1. Find user by email - ✅ Changed to .populate("roles")
        let user = await User.findOne({ email }).populate("roles");

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.isVerified = true;
            await user.save();
          }
          return done(null, user);
        }

        // 2. Get default role
        const defaultRole = await Role.findOne({ name: "user" });

        // 3. Create user - ✅ Changed 'role' to 'roles' array
        const newUser = await User.create({
          username: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          isVerified: true,
          roles: defaultRole ? [defaultRole._id] : [],
        });

        // 4. ✅ Changed to .populate("roles")
        const populatedUser = await User.findById(newUser._id).populate(
          "roles",
        );

        return done(null, populatedUser);
      } catch (error) {
        console.error("💥 Google Strategy Error:", error);
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // 5. ✅ Changed to .populate("roles")
    const user = await User.findById(id).populate("roles");
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    console.error("💥 Deserialize Error:", error);
    done(error, null);
  }
});

export default passport;
