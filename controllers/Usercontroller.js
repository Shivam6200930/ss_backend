import { user, Product } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../config/emailConfig.js";
class Usercontroller {
  static UserRegistration = async (req, res) => {
    const { name, email, password, password_confirm } = req.body;
    try {
      const User = await user.findOne({ email: email });
      if (User) {
        res.send({ status: "failed", message: "User already exists" });
      } else {
        if (name && email && password && password_confirm) {
          if (password === password_confirm) {
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);
            const doc = new user({
              name: name,
              email: email,
              password: hashPassword,
            });
            await doc.save();
            const saved_user = await user.findOne({ email: email });
            console.log("user saved", saved_user);
            const token = jwt.sign(
              { userID: saved_user._id },
              process.env.jwt_secret_key,
              { expiresIn: "7d" }
            );

            const mailOptions = {
              from: process.env.EMAILFROM,
              to: saved_user.email,
              subject: "WELCOME TO OUR SHIVAM MART",
              text: "welcome to our shivam mart here all product are avaible.",
            };
            console.log("mailOption");
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error(error);
              } else {
                console.log("Email sent: " + info.response);
              }
            });

            res
              .status(200)
              .json({
                message: "data saved",
                token: token,
                mail: "email send sucessful",
              });
          } else {
            res.send({
              status: "failed",
              message: "password and confirm password aren't match",
            });
          }
        } else {
          res.send({ status: "failed", message: "all fields are required" });
        }
      }
    } catch (err) {
      res.status(400).json({ message: "something went wrong" });
    }
  };

  static UserLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
      if (email && password) {
        const User = await user.findOne({ email: email });
        if (User != null) {
          const isMatch = await bcrypt.compare(password, User.password);
          if (User.email === email && isMatch) {
            const token = jwt.sign(
              { userID: User._id },
              process.env.jwt_secret_key,
              { expiresIn: "7d" }
            );
            res.cookie("shivam", token, { httpOnly: true },{ maxAge: 24 * 60 * 60 * 1000 });
            res.status(200).json({ message: "Login Sucessfull", user: User });
          } else {
            res.status(400).json({ message: "Invalid email or password" });
          }
        } else {
          res.send({ status: "failed", message: "you didn't regesister" });
        }
      } else {
        res.send({ status: "failed", message: "all Field are requried" });
      }
    } catch (err) {
      res.status(400).json({ message: "something went wrong" });
      console.log(err);
    }
  };

  static changeUserpassword = async (req, res) => {
    const { password, password_confirm } = req.body;
    const foundUser = await user.findById(req.user._id);

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (password && password_confirm) {
      if (password === password_confirm) {
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);
        await user.findByIdAndUpdate(req.user._id, {
          $set: { password: hashpassword },
        });

        const mailOptions = {
          from: process.env.EMAILFROM,
          to: foundUser.email,
          subject: "Password changed",
          text: "You sucessful change your password if you have not changed your password then you info our contact detailas",
        };
        console.log("mailOption");
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
        res
          .status(200)
          .json({
            message: "password are changed",
            mail: "you sucesfully change your password",
          });
      } else {
        res
          .status(400)
          .json({ message: "password and re-enter aren't match " });
      }
    } else {
      res.status(400).json({ message: "all field are requried" });
    }
  };

  static loggedUser = async (req, res) => {
    res.send({ user: req.user });
  };

  static resetPassword = async (req, res) => {
    try {
      const { email } = req.body;

      if (email) {
        const User = await user.findOne({ email: email });

        if (User) {
          const secret = User._id + process.env.JWT_SECRET_KEY;
          const token = jwt.sign({ userID: User._id }, secret, {
            expiresIn: "10m",
          });

          const link = `http://127.0.0.1:5173/api/users/resetPassword/${User._id}/${token}`;
          const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: User.email,
            subject: "Shivam Mart Password Reset Link",
            text: "This mail is only for a password reset",
            html: `<a href=${link}>Click Here</a> to reset your password`,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error(error);
              res
                .status(500)
                .json({
                  status: "failed",
                  message: "Failed to send reset email",
                });
            } else {
              console.log("Email sent: " + info.response);
              res
                .status(203)
                .json({
                  status: "passed",
                  message: "Email sent for your reset password",
                });
            }
          });
        } else {
          res
            .status(403)
            .json({ status: "failed", message: "Email doesn't exist" });
        }
      } else {
        res.status(403).json({ message: "Please enter your email address" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "failed", message: "Internal server error" });
    }
  };

  static userPasswordReset = async (req, res) => {
    try {
      const { password, password_confirm } = req.body;
      const { id, token } = req.params;

      const User = await user.findById(id);
      const secret = User._id + process.env.JWT_SECRET_KEY;

      const decodedToken = jwt.verify(token, secret);

      if (decodedToken.userID === User._id) {
        if (password && password_confirm) {
          if (password === password_confirm) {
            const salt = await bcrypt.genSalt(10);
            const hashpassword = await bcrypt.hash(password, salt);

            await user.findByIdAndUpdate(User._id, {
              $set: { password: hashpassword },
            });

            const mailOptions = {
              from: process.env.EMAIL_FROM,
              to: User.email,
              subject: "Password changed successfully!",
              text: "You have changed your password successfully!!",
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error(error);
              } else {
                console.log("Email sent: " + info.response);
              }
            });

            res
              .status(200)
              .json({
                message: "Password changed",
                mail: "Email sent successfully",
              });
          } else {
            res.status(403).json({
              status: "failed",
              message: "Password and confirm password do not match",
            });
          }
        } else {
          res.status(403).json({ message: "All fields are required" });
        }
      } else {
        res.status(403).json({ status: "failed", message: "Invalid token" });
      }
    } catch (err) {
      console.error(err);
      res
        .status(404)
        .json({ status: "failed", message: "Your link has expired" });
    }
  };

  static userDelete = async (req, res) => {
    const { id } = req.params;
    try {
      await user.findByIdAndDelete(id);
      res.status(200).json({ message: "User deleted are successfully" });
    } catch (err) {
      res
        .status(400)
        .json({ status: "failed", message: "User are not deleted" });
    }
  };

  static UserLogout = async (req, res) => {
    try {
      res.clearCookie("shivam");
      return res.status(200).json("logout");
    } catch (err) {
      return res.status(500).json(err.message);
    }
  };

  static UserEdit = async (req, res) => {
    const id = req.params.user_id;
    const User = await user.findById(id);
    const { user_name } = req.body;
    if (!User) {
      res.status(400).json({ message: "failed" });
    } else {
      User.name = user_name;
      User.save();
      res.status(200).json({ message: "saved", User });
    }
  };
  static product = async (req, res) => {
    const { name, imageUrl, description, price, quantity } = req.body;
    try {
      const doc = new Product({
        name: name,
        imageUrl: imageUrl,
        description: description,
        price: price,
        quantity: quantity,
      });

      await doc.save();
      res.status(200).json({ message: "saved" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  static search = async (req, res) => {
    try {
      const searchTerm = req.query.q;

      if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
      }

      const results = await Product.find({
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
        ],
      });
      res.status(200).json({ message: "sucessul", data: results });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  static products = async (req, res) => {
    try {
      const products = await Product.find();
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  static contact = async (req, res) => {
    const { feedback, email } = req.body;
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Feedback from website",
        text: feedback,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).json({ error: "Error sending email" });
        } else {
          console.log("Email sent: " + info.response);
          res.status(200).json({ message: "Email sent successfully" });
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static order_history = async (req, res) => {
    try {
        const id = req.params.userId;
        const buyProducts = req.body.products_details;
        console.log(`order_history ${JSON.stringify(buyProducts)}`);

        const User = await user.findById(id);

        if (!User) {
            return res.status(404).json({
                status: "Not Found",
                message: "User not found in our database"
            });
        }
        buyProducts.forEach(product => {
            User.orderHistory.push(product);
        });

        await User.save();

        return res.status(200).json({
            status: "Success",
            message: "Order history updated successfully"
        });
    } catch (error) {
        console.error('Error updating order history:', error);
        return res.status(500).json({
            status: "Error",
            message: "An error occurred while updating order history"
        });
    }
}

}
export default Usercontroller;
