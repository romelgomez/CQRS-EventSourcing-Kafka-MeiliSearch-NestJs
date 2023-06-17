import { Body, Controller, Param, Post, Patch } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { CreateProfileDto } from "./dtos/create-profile-dto";
import { ProfileDocument } from "./profile.schema";
import { MessagePattern, Payload} from "@nestjs/microservices"
import { InputSearchDto } from "./dtos/input-search-dto";
import { v4 as uuid } from 'uuid';
import { UpdateProfileStateDto } from "./dtos/update-profile-state";

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    // this endpoint is public
    @Post('/')
    async createProfile(@Body() profileDto: CreateProfileDto): Promise<ProfileDocument> {
        profileDto.id = uuid();

        // 
        // flow
        //
        // createProfile
        //  call commandBus.execute
        //      in src/profile/commands/impl/create-profile-command.ts
        //          call profileRepository.createOne
        //              in src/profile/profile.repository.ts
        //          call publisher.mergeObjectContext
        //              in src/profile/commands/handlers/create-profile-handler.ts
        // 
        //  saving in mongoose
        //  publishing event  
        //  in src/profile/commands/handlers/create-profile-handler.ts
        // 

        // flow
        // the controller call the service
        // the service call the commandBus
        // the commandBus call the commandHandler that call the [repository] and the [publisher]
        //   - the respository save the data in the database in this case mongodb
        //   - the publisher publish the event in kafka
        // the funciton addJobDocument is called by the kafka consumer and add the data in the index in this case meilisearch


        // this flow first save the data in the database "mongodb" and then publish the event in kafka, and then the kafka consumer add the data in the index

        return this.profileService.createProfile(profileDto);
    }

    // this endpoint is public
    @Patch('/:id') 
    async updateProfileState(@Body() state: UpdateProfileStateDto, @Param('id') id: string) {
        return this.profileService.updateProfileState(state, id);
    }

    // this end point is called by the kafka consumer
    @MessagePattern("create-profile-evnt")
    async addProfileToIndex(@Payload() profile) {        
        return this.profileService.addJobDocument([profile]);
    }

    // this endpoint is public
    @Post('/search')
    async searchForProfile(@Body() search: InputSearchDto) {
        return this.profileService.searchForProfiles(search)
    }

    // this endpoint is public
    @Post('/indexs/:index')
    public async deleteIndex(@Param('index') index: string ) {
        return await this.profileService.deleteIndex(index);
    }
}