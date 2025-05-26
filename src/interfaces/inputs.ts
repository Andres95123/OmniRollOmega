// Created by : Andres
// Created on : 19-04-2025
// Description : This file contains the interfaces for the inputs of the OmniRollMax application.

export interface UserCreateRequest {
  name: string;
}

export interface EpisodeCommentsRequest {
  episode_id: string;
}

export interface SerieDTO {
  crunchy_id: string;
  title: string;
  episodes: number;
  rating: string;
  score: number;
  dubs: string[];
  subs: string[];
}

export interface EpisodeUpdateRequest {
  anime_id: string;
  episode: number;
  episode_id: string;
  title: string;
}
