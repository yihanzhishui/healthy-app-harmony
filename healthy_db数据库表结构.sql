-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: healthy_db
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_plan`
--

DROP TABLE IF EXISTS `ai_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_plan` (
  `ai_plan_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `fat_loss_plan_id` int NOT NULL,
  `plan_name` varchar(20) NOT NULL,
  `recommended_calories` int NOT NULL,
  `exercise_plan_ids` varchar(255) NOT NULL,
  `create_time` datetime NOT NULL,
  `recommended_diet_ids` varchar(255) NOT NULL,
  PRIMARY KEY (`ai_plan_id`),
  KEY `user_id` (`user_id`),
  KEY `fat_loss_plan_id` (`fat_loss_plan_id`),
  KEY `diet_record_id` (`exercise_plan_ids`),
  CONSTRAINT `ai_plan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `ai_plan_ibfk_2` FOREIGN KEY (`fat_loss_plan_id`) REFERENCES `fat_loss_plan` (`plan_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diet_record`
--

DROP TABLE IF EXISTS `diet_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diet_record` (
  `diet_record_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `diet_type` varchar(20) NOT NULL,
  `food_id` int NOT NULL,
  `eat_quantity` int NOT NULL,
  `calories_intake` int NOT NULL,
  `create_time` datetime NOT NULL,
  `eat_time` datetime NOT NULL,
  PRIMARY KEY (`diet_record_id`),
  KEY `user_id` (`user_id`),
  KEY `food_id` (`food_id`),
  CONSTRAINT `diet_record_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `diet_record_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food` (`food_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercise_plan`
--

DROP TABLE IF EXISTS `exercise_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise_plan` (
  `exercise_plan_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exercise_type` varchar(20) NOT NULL,
  `exercise_time` varchar(255) NOT NULL COMMENT '锻炼时间',
  `distance` float NOT NULL,
  `duration` float NOT NULL,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`exercise_plan_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `exercise_plan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercise_record`
--

DROP TABLE IF EXISTS `exercise_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise_record` (
  `exercise_record_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exercise_type` varchar(20) NOT NULL,
  `exercise_time` datetime NOT NULL,
  `calories_burned` int NOT NULL,
  `distance` float DEFAULT NULL,
  `duration` int NOT NULL,
  `exercise_track` text,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`exercise_record_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `exercise_record_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fat_loss_plan`
--

DROP TABLE IF EXISTS `fat_loss_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fat_loss_plan` (
  `plan_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `plan_name` varchar(20) NOT NULL,
  `target_weight` float NOT NULL,
  `reduction_speed` varchar(2) NOT NULL,
  `focus_area` varchar(14) NOT NULL,
  `plan_cycle` int NOT NULL,
  `plan_start_time` datetime NOT NULL,
  `plan_end_time` datetime NOT NULL,
  `create_date` datetime NOT NULL,
  PRIMARY KEY (`plan_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fat_loss_plan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `favorite_music`
--

DROP TABLE IF EXISTS `favorite_music`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorite_music` (
  `favorite_music_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `music_id` int DEFAULT NULL,
  `favorite_time` datetime NOT NULL,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`favorite_music_id`),
  KEY `user_id` (`user_id`),
  KEY `music_id` (`music_id`),
  CONSTRAINT `favorite_music_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `favorite_music_ibfk_2` FOREIGN KEY (`music_id`) REFERENCES `music` (`music_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `food`
--

DROP TABLE IF EXISTS `food`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `food` (
  `food_id` int NOT NULL AUTO_INCREMENT,
  `food_name` varchar(20) NOT NULL,
  `food_image` varchar(255) DEFAULT NULL,
  `calories` int NOT NULL,
  `create_time` datetime NOT NULL,
  `food_tags` varchar(20) NOT NULL,
  PRIMARY KEY (`food_id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `health_indicator_record`
--

DROP TABLE IF EXISTS `health_indicator_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `health_indicator_record` (
  `health_indicator_record_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `measure_time` datetime NOT NULL,
  `measure_type` varchar(20) NOT NULL,
  `measure_result` varchar(20) NOT NULL,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`health_indicator_record_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `health_indicator_record_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `music`
--

DROP TABLE IF EXISTS `music`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `music` (
  `music_id` int NOT NULL AUTO_INCREMENT,
  `music_name` varchar(20) NOT NULL,
  `music_file_path` varchar(255) NOT NULL,
  `music_duration` int NOT NULL,
  `music_file_type` varchar(20) NOT NULL,
  `music_file_size` float NOT NULL,
  `music_file_md5` varchar(32) NOT NULL,
  `music_album_cover` varchar(255) DEFAULT NULL,
  `tags` varchar(50) NOT NULL,
  `category` varchar(5) NOT NULL,
  `listen_count` int NOT NULL DEFAULT '0',
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`music_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recommended_diet`
--

DROP TABLE IF EXISTS `recommended_diet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recommended_diet` (
  `recommended_diet_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `food_id` int NOT NULL,
  `eat_quantity` int NOT NULL,
  `fat_loss_plan_id` int DEFAULT NULL,
  `calories_intake` int NOT NULL,
  `diet_type` varchar(20) NOT NULL,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`recommended_diet_id`),
  KEY `user_id` (`user_id`),
  KEY `food_id` (`food_id`),
  CONSTRAINT `recommended_diet_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  CONSTRAINT `recommended_diet_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `food` (`food_id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sleep_record`
--

DROP TABLE IF EXISTS `sleep_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sleep_record` (
  `sleep_record_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `bed_time` datetime NOT NULL,
  `sleep_interval` int NOT NULL,
  `wake_time` datetime NOT NULL,
  `wake_up_interval` int NOT NULL,
  `bed_time_duration` int NOT NULL,
  `sleep_duration` int NOT NULL,
  `sleep_quality` varchar(20) NOT NULL,
  `record_time` datetime NOT NULL,
  `create_time` datetime NOT NULL,
  `sleep_time` datetime NOT NULL,
  `wake_up_time` datetime NOT NULL,
  PRIMARY KEY (`sleep_record_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sleep_record_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `salt` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `avatar` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `is_deleted` tinyint(1) NOT NULL,
  `huawei_account` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_info`
--

DROP TABLE IF EXISTS `user_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_info` (
  `user_id` int NOT NULL,
  `height` float DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `birthday` datetime DEFAULT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'healthy_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-05-30 13:26:33
