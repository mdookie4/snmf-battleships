

create database snmf_battleship;
use snmf_battleship;
create table player (
	player_id varchar(64) not null,
    password varchar(64) not null,
    primary key(player_id)
);

create table playerWithImg (
	player_id varchar(64) not null,
    password varchar(64) not null,
    imgKey varchar(64),
    primary key(player_id)
);

insert into player(player_id, password) values
	('admiral1', 'admiral1');
    
SELECT COUNT(*) as "match" from player where player_id = 'admiral1' AND password = 'admiral1';

SELECT * from player where player_id = 'admiral' and password = 'admiral';

create table playerStats (
	idx int not null auto_increment,
	player_id varchar(64) not null,
    player_hits varchar(64) not null,
    player_misses varchar(64) not null,
    player_shots varchar(64) not null,
    primary key(idx)
);

INSERT into playerStats(player_id, player_hits, player_misses, player_shots) values('admiral', '2', '4', '6');
INSERT into playerStats(player_id, player_hits, player_misses, player_shots) values('admiral2', '4', '2', '6');

SELECT * from playerStats order by player_hits desc; 

SELECT * from player where player_id = 'admiral';